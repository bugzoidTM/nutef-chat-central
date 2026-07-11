/**
 * Nutef Chat Central — servidor bridge (watende.nutef.com)
 *
 * Substitui a Evolution API pelo padrão whatsai (agente-ia-whatsapp) e os
 * edge functions do Supabase cloud (projeto deletado) por endpoints locais:
 *
 *   - Serve o frontend (dist/) com fallback SPA
 *   - /api/wa/*        → proxy autenticado para o whatsai interno (login por sessão)
 *   - /webhook/whatsai → recebe eventos do whatsai (messages.upsert, connection.update,
 *                        qrcode.updated), grava no Supabase local (schema watende) e
 *                        roda o pipeline do chatbot server-side (24/7, sem depender do
 *                        dashboard aberto — melhoria sobre o design original)
 *   - /api/fn/*        → portes dos edge functions: create-attendant,
 *                        send-satisfaction-survey, chatbot-processor, signup
 */
const express = require("express");
const path = require("path");
const jwt = require("jsonwebtoken");
const { createClient } = require("@supabase/supabase-js");

const PORT = Number(process.env.PORT || 3000);
const SUPABASE_URL = process.env.SUPABASE_URL || "https://supabase.nutef.com";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET || "";
const DB_SCHEMA = process.env.DB_SCHEMA || "watende";
const WHATSAI_URL = (process.env.WHATSAI_URL || "http://agente-ia-whatsapp:3000").replace(/\/$/, "");
const WHATSAI_PASSWORD = process.env.WHATSAI_PASSWORD || "";
const WEBHOOK_TOKEN = process.env.WEBHOOK_TOKEN || "";
const WEBHOOK_URL = process.env.WEBHOOK_URL || `http://watende:${PORT}/webhook/whatsai`;
const APP_URL = (process.env.APP_URL || "https://watende.nutef.com").replace(/\/$/, "");
// Mensagens com timestamp mais antigo que isso são ignoradas — evita que o
// history sync do WhatsApp (enviado ao escanear o QR) inunde o painel e que
// o chatbot responda mensagem velha. 0 desativa o filtro.
const MESSAGE_MAX_AGE_MINUTES = Number(process.env.MESSAGE_MAX_AGE_MINUTES || 30);
// Conversas sem atividade há N dias são arquivadas automaticamente. 0 desativa.
const ARCHIVE_AFTER_DAYS = Number(process.env.ARCHIVE_AFTER_DAYS || 30);

for (const [k, v] of Object.entries({ SUPABASE_SERVICE_ROLE_KEY, SUPABASE_JWT_SECRET, WHATSAI_PASSWORD, WEBHOOK_TOKEN })) {
  if (!v) console.warn(`⚠️  Variável ${k} não definida — funcionalidades dependentes vão falhar.`);
}

const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
  db: { schema: DB_SCHEMA },
});

// =====================================
// Cliente whatsai — login por senha + cookie de sessão, retry em 401
// =====================================
let waCookie = null;

async function waLogin() {
  const res = await fetch(`${WHATSAI_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password: WHATSAI_PASSWORD }),
  });
  if (!res.ok) throw new Error(`Login no whatsai falhou: HTTP ${res.status}`);
  const setCookie = res.headers.get("set-cookie");
  if (!setCookie) throw new Error("whatsai não retornou cookie de sessão");
  waCookie = setCookie.split(";")[0];
}

async function waFetch(pathname, options = {}, retry = true) {
  if (!waCookie) await waLogin();
  const res = await fetch(`${WHATSAI_URL}${pathname}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Cookie: waCookie,
      ...(options.headers || {}),
    },
  });
  if (res.status === 401 && retry) {
    waCookie = null;
    return waFetch(pathname, options, false);
  }
  let body = null;
  try { body = await res.json(); } catch (_) {}
  return { status: res.status, ok: res.ok, body };
}

async function waListInstances() {
  const r = await waFetch("/api/instances");
  if (!r.ok) throw new Error(`whatsai /api/instances: HTTP ${r.status}`);
  return Array.isArray(r.body) ? r.body : [];
}

async function waSend(instanceName, to, message) {
  const r = await waFetch(`/api/${encodeURIComponent(instanceName)}/send`, {
    method: "POST",
    body: JSON.stringify({ to, message }),
  });
  if (!r.ok) throw new Error(r.body?.error || `whatsai /send: HTTP ${r.status}`);
  return r.body;
}

// Configuração padrão de uma instância dedicada ao chat central:
// bot interno do whatsai desligado (o chatbot roda aqui, com a base do painel)
// e webhook apontando para este bridge.
async function waConfigureInstance(instanceName) {
  const r = await waFetch(`/api/${encodeURIComponent(instanceName)}/config`, {
    method: "POST",
    body: JSON.stringify({
      humanoAtendeu: true,
      useAI: false,
      webhooks: [
        {
          url: WEBHOOK_URL,
          events: ["messages.upsert", "connection.update", "qrcode.updated"],
          enabled: true,
          token: WEBHOOK_TOKEN,
        },
      ],
    }),
  });
  if (!r.ok) throw new Error(r.body?.error || `whatsai /config: HTTP ${r.status}`);
}

// =====================================
// EXPRESS
// =====================================
const app = express();
app.use(express.json({ limit: "25mb" })); // webhooks do whatsai podem trazer mídia em base64

// ── Autenticação: JWT do Supabase (HS256, secret compartilhado) ──
function requireUser(req, res, next) {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Não autenticado" });
  try {
    const payload = jwt.verify(token, SUPABASE_JWT_SECRET, { audience: "authenticated" });
    req.userId = payload.sub;
    next();
  } catch (e) {
    return res.status(401).json({ error: "Token inválido ou expirado" });
  }
}

async function getProfile(userId) {
  const { data } = await db.from("profiles").select("*").eq("user_id", userId).maybeSingle();
  return data || null;
}

// =====================================
// /api/wa — API WhatsApp para o frontend (compatível com a camada Evolution)
// =====================================

// Estado de conexão — formato Evolution: { instance: { instanceName, state } }
app.get("/api/wa/connection-state/:instance", requireUser, async (req, res) => {
  try {
    const name = req.params.instance;
    const list = await waListInstances();
    const inst = list.find((i) => i.name === name);
    if (!inst) return res.status(404).json({ error: `Instance "${name}" does not exist (404)` });
    const state = inst.connected ? "open" : inst.initializing || inst.qrCode ? "connecting" : "close";
    res.json({ instance: { instanceName: name, state } });
  } catch (e) {
    res.status(502).json({ error: e.message });
  }
});

// Criar instância + configurar webhook + gerar QR — formato Evolution createInstance
app.post("/api/wa/instances", requireUser, async (req, res) => {
  try {
    const { instanceName } = req.body || {};
    if (!instanceName || !/^[A-Za-z0-9_-]+$/.test(instanceName))
      return res.status(400).json({ error: "instanceName inválido" });

    const list = await waListInstances();
    const existing = list.find((i) => i.name === instanceName);
    if (!existing) {
      const r = await waFetch("/api/instances", { method: "POST", body: JSON.stringify({ name: instanceName }) });
      if (!r.ok) return res.status(502).json({ error: r.body?.error || "Erro ao criar instância no whatsai" });
    }
    await waConfigureInstance(instanceName);

    // Gera o QR (restart) se ainda não conectada
    if (!existing?.connected) {
      await waFetch(`/api/${encodeURIComponent(instanceName)}/whatsapp/restart`, { method: "POST" });
    }

    // Aguarda o QR aparecer (o whatsapp-web.js leva ~10-60s para gerar)
    let base64 = null;
    for (let i = 0; i < 20; i++) {
      await new Promise((r) => setTimeout(r, 3000));
      const inst = (await waListInstances()).find((x) => x.name === instanceName);
      if (inst?.connected) return res.json({ instance: { instanceName, status: "connected" } });
      if (inst?.qrCode) { base64 = inst.qrCode; break; }
    }
    res.json({ instance: { instanceName, status: "connecting" }, qrcode: base64 ? { base64 } : undefined });
  } catch (e) {
    res.status(502).json({ error: e.message });
  }
});

// Obter QR atual — formato Evolution: { base64 }
app.get("/api/wa/qr/:instance", requireUser, async (req, res) => {
  try {
    const name = req.params.instance;
    let inst = (await waListInstances()).find((i) => i.name === name);
    if (!inst) return res.status(404).json({ error: `Instance "${name}" does not exist (404)` });
    if (inst.connected) return res.json({ base64: null, connected: true });
    if (!inst.qrCode && !inst.initializing) {
      await waFetch(`/api/${encodeURIComponent(name)}/whatsapp/restart`, { method: "POST" });
    }
    for (let i = 0; i < 15 && !inst?.qrCode; i++) {
      await new Promise((r) => setTimeout(r, 3000));
      inst = (await waListInstances()).find((x) => x.name === name);
      if (inst?.connected) return res.json({ base64: null, connected: true });
    }
    if (!inst?.qrCode) return res.status(504).json({ error: "QR Code ainda não disponível, tente novamente" });
    res.json({ base64: inst.qrCode });
  } catch (e) {
    res.status(502).json({ error: e.message });
  }
});

// Enviar mensagem — usa remote_jid salvo na conversa quando existir (suporte a @lid)
app.post("/api/wa/send", requireUser, async (req, res) => {
  try {
    const { instanceName, number, text } = req.body || {};
    if (!instanceName || !number || !text)
      return res.status(400).json({ error: "instanceName, number e text são obrigatórios" });

    let to = String(number).replace(/\D/g, "");
    const { data: conv } = await db
      .from("conversations")
      .select("remote_jid, instances:instance_id(instance_name)")
      .eq("client_phone", to)
      .not("remote_jid", "is", null)
      .order("last_message_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (conv?.remote_jid && conv?.instances?.instance_name === instanceName) to = conv.remote_jid;

    await waSend(instanceName, to, text);
    res.json({ key: { fromMe: true }, status: "sent" });
  } catch (e) {
    res.status(502).json({ error: e.message });
  }
});

// Histórico de mensagens do whatsai (fallback/diagnóstico) — formato EvolutionMessage[]
app.get("/api/wa/messages/:instance", requireUser, async (req, res) => {
  try {
    const { instance } = req.params;
    const jid = String(req.query.jid || "");
    const limit = Number(req.query.limit) || 100;
    const r = await waFetch(`/api/${encodeURIComponent(instance)}/messages?jid=${encodeURIComponent(jid)}&limit=${limit}`);
    if (!r.ok) return res.status(502).json({ error: r.body?.error || "Erro ao ler histórico" });
    const messages = (Array.isArray(r.body) ? r.body : []).map((m) => ({
      key: m.key || { remoteJid: m.remoteJid, fromMe: !!m.fromMe, id: m.id || "" },
      message: m.message || { conversation: m.body || m.content || "" },
      messageType: m.messageType || "conversation",
      messageTimestamp: m.messageTimestamp || Math.floor(Date.now() / 1000),
      pushName: m.pushName || "",
    }));
    res.json({ messages });
  } catch (e) {
    res.status(502).json({ error: e.message });
  }
});

// Webhook config (compat com WebhookSettings do painel)
app.get("/api/wa/webhook/:instance", requireUser, async (req, res) => {
  try {
    const r = await waFetch(`/api/${encodeURIComponent(req.params.instance)}/config/full`);
    if (!r.ok) return res.status(502).json({ error: "Erro ao consultar config no whatsai" });
    const wh = (r.body?.webhooks || [])[0] || null;
    res.json({ enabled: !!wh, url: wh?.url || null, events: wh?.events || [] });
  } catch (e) {
    res.status(502).json({ error: e.message });
  }
});

app.post("/api/wa/webhook/:instance", requireUser, async (req, res) => {
  try {
    await waConfigureInstance(req.params.instance);
    res.json({ ok: true, url: WEBHOOK_URL });
  } catch (e) {
    res.status(502).json({ error: e.message });
  }
});

// =====================================
// /webhook/whatsai — ingestão de eventos (porte do edge function evolution-webhook)
// =====================================
app.post("/webhook/whatsai", async (req, res) => {
  const auth = req.headers.authorization || "";
  if (!WEBHOOK_TOKEN || auth !== `Bearer ${WEBHOOK_TOKEN}`)
    return res.status(401).json({ error: "Token inválido" });

  const { event, instance: instanceName, data } = req.body || {};
  if (!event || !instanceName) return res.status(400).json({ error: "event e instance são obrigatórios" });

  try {
    if (event === "messages.upsert") {
      await handleMessagesUpsert(instanceName, data);
    } else if (event === "connection.update") {
      const status = data?.state === "open" ? "connected" : data?.state === "connecting" ? "connecting" : "disconnected";
      await db.from("instances").update({ status, ...(status === "connected" ? { qr_code: null } : {}) }).eq("instance_name", instanceName);
    } else if (event === "qrcode.updated") {
      if (data?.base64 || data?.qrcode)
        await db.from("instances").update({ qr_code: data.base64 || data.qrcode, status: "qr_code" }).eq("instance_name", instanceName);
    }
    res.json({ success: true, event, instance: instanceName });
  } catch (e) {
    console.error(`❌ Webhook ${event}/${instanceName}:`, e);
    res.status(500).json({ error: e.message });
  }
});

function extractContent(data) {
  const msg = data?.message || {};
  let content = msg.conversation || msg.extendedTextMessage?.text || "";
  // whatsai manda messageType descritivo para mídia ("image", "document", "video"...)
  const rawType = String(data?.messageType || "conversation");
  const typeMap = { conversation: "text", text: "text", image: "image", imagem: "image", video: "video", audio: "audio", document: "document", documento: "document", sticker: "text", location: "text", contact: "text" };
  const messageType = typeMap[rawType.toLowerCase()] || "text";
  if (!content && messageType !== "text") content = `[${rawType} recebida]`;
  return { content: String(content).trim(), messageType };
}

function extractClientIdentity(data) {
  const remoteJid = String(data?.key?.remoteJid || "");
  const digits = (v) => String(v || "").replace(/\D/g, "");
  let phone = digits(data?.contactNumber);
  if (!phone && (remoteJid.endsWith("@c.us") || remoteJid.endsWith("@s.whatsapp.net")))
    phone = digits(remoteJid.split("@")[0]);
  if (!phone) phone = digits(remoteJid.split("@")[0]); // @lid: identificador interno, melhor que nada
  const name = String(data?.contactName || data?.pushName || data?.profileName || data?.verifiedName || "").trim();
  return { remoteJid, phone, name };
}

async function handleMessagesUpsert(instanceName, data) {
  if (!data?.key) return;

  if (MESSAGE_MAX_AGE_MINUTES > 0 && data.messageTimestamp) {
    const ageMinutes = (Date.now() / 1000 - Number(data.messageTimestamp)) / 60;
    if (ageMinutes > MESSAGE_MAX_AGE_MINUTES) return;
  }

  const { data: instanceRow } = await db.from("instances").select("*").eq("instance_name", instanceName).maybeSingle();
  if (!instanceRow) {
    console.warn(`Instância ${instanceName} não cadastrada no painel — evento ignorado`);
    return;
  }

  const whatsappMessageId = data.key.id || null;
  if (whatsappMessageId) {
    const { data: dup } = await db.from("messages").select("id").eq("whatsapp_message_id", whatsappMessageId).limit(1).maybeSingle();
    if (dup) return; // já processada
  }

  const { remoteJid, phone, name } = extractClientIdentity(data);
  if (!phone) return;
  const { content, messageType } = extractContent(data);
  if (!content) return;

  const incoming = data.key.fromMe !== true;

  // Localiza/cria a conversa
  let { data: conversation } = await db
    .from("conversations")
    .select("id, status, assigned_to, sector_id, client_phone")
    .eq("client_phone", phone)
    .eq("instance_id", instanceRow.id)
    .maybeSingle();

  if (conversation) {
    const update = { last_message_at: new Date().toISOString(), remote_jid: remoteJid || undefined };
    if (incoming && (conversation.status === "finished" || conversation.status === "archived")) {
      update.status = "new";
      update.assigned_to = null;
      conversation.status = "new";
      conversation.assigned_to = null;
    }
    if (incoming && name) update.client_name = name;
    await db.from("conversations").update(update).eq("id", conversation.id);
  } else {
    const { data: defaultSector } = await db.from("sectors").select("id").eq("is_active", true).limit(1).maybeSingle();
    const { data: created, error } = await db
      .from("conversations")
      .insert({
        client_phone: phone,
        client_name: name || phone,
        remote_jid: remoteJid || null,
        instance_id: instanceRow.id,
        sector: "support",
        sector_id: defaultSector?.id || null,
        status: "new",
        last_message_at: new Date().toISOString(),
      })
      .select("id, status, assigned_to, sector_id, client_phone")
      .single();
    if (error) throw error;
    conversation = created;
  }

  const ts = data.messageTimestamp ? new Date(Number(data.messageTimestamp) * 1000) : new Date();
  const { error: msgError } = await db.from("messages").insert({
    conversation_id: conversation.id,
    content,
    direction: incoming ? "incoming" : "outgoing",
    from_phone: incoming ? phone : instanceRow.phone,
    to_phone: incoming ? instanceRow.phone : phone,
    message_type: messageType,
    timestamp: (isNaN(ts.getTime()) ? new Date() : ts).toISOString(),
    whatsapp_message_id: whatsappMessageId,
    ...(incoming ? {} : { is_read: true, sender_name: data.pushName || "WhatsApp", sender_sector: "Externo" }),
  });
  if (msgError) throw msgError;

  // Pipeline do chatbot server-side (melhoria: original dependia do dashboard aberto)
  if (incoming && messageType === "text") {
    processChatbot(instanceName, conversation, content, phone).catch((e) =>
      console.error(`Chatbot pipeline (${conversation.id}):`, e.message)
    );
  }
}

// =====================================
// Chatbot server-side — porte de useChatbotIntegration + chatbot-processor,
// agora enviando as respostas de verdade via whatsai.
// =====================================
function checkWorkingHours(wh) {
  if (!wh || !wh.is_enabled) return true;
  const now = new Date();
  const currentDay = now.getDay();
  const currentTime = now.toTimeString().slice(0, 5);
  if (!Array.isArray(wh.working_days) || !wh.working_days.includes(currentDay)) return false;
  if (currentTime < wh.start_time || currentTime > wh.end_time) return false;
  return true;
}

async function sendSystemMessage(instanceName, conversation, clientPhone, content, senderName, senderSector) {
  try {
    await waSend(instanceName, clientPhone, content);
  } catch (e) {
    console.error(`Envio whatsai falhou (${instanceName} → ${clientPhone}):`, e.message);
  }
  await db.from("messages").insert({
    conversation_id: conversation.id,
    from_phone: senderName === "Assistente Virtual" ? "CHATBOT" : "SYSTEM",
    to_phone: clientPhone,
    content,
    message_type: "text",
    direction: "outgoing",
    is_read: true,
    sender_name: senderName,
    sender_sector: senderSector,
  });
}

async function processChatbot(instanceName, conversation, userInput, clientPhone) {
  if (conversation.status !== "new" || conversation.assigned_to) return;
  if (!conversation.sector_id) return;

  const sectorId = conversation.sector_id;
  const { data: workingHours } = await db.from("working_hours").select("*").eq("sector_id", sectorId).maybeSingle();

  if (!checkWorkingHours(workingHours) && workingHours?.auto_response_enabled) {
    const autoMessage = String(workingHours.auto_response_message || "")
      .replace("{start_time}", workingHours.start_time)
      .replace("{end_time}", workingHours.end_time);
    if (autoMessage) await sendSystemMessage(instanceName, conversation, clientPhone, autoMessage, "Sistema Automático", "Sistema");

    if (workingHours.queue_enabled) {
      await db.from("off_hours_queue").insert({
        conversation_id: conversation.id,
        sector_id: sectorId,
        client_phone: clientPhone,
        client_name: null,
        priority: 1,
        status: "waiting",
      });
      if (workingHours.queue_message)
        await sendSystemMessage(instanceName, conversation, clientPhone, workingHours.queue_message, "Sistema Automático", "Sistema");
    }
    return;
  }

  // Chatbot ativo para o setor?
  const { data: isActive, error: activeError } = await db.rpc("is_chatbot_active", { p_sector_id: sectorId });
  if (activeError || !isActive) return;

  // Palavras de escalação
  const { data: cfg } = await db.from("chatbot_configs").select("auto_escalation_keywords").eq("sector_id", sectorId).maybeSingle();
  const keywords = cfg?.auto_escalation_keywords || [];
  const lower = userInput.toLowerCase();
  if (keywords.some((k) => lower.includes(String(k).toLowerCase()))) {
    await db.from("conversation_context").upsert({
      conversation_id: conversation.id,
      escalation_reason: "Cliente solicitou atendimento humano",
      bot_interaction_summary: `Cliente mencionou: "${userInput}"`,
    }, { onConflict: "conversation_id" });
    await sendSystemMessage(instanceName, conversation, clientPhone,
      "Entendi que você gostaria de falar com um atendente humano. Aguarde um instante que já vamos te atender!",
      "Assistente Virtual", "Chatbot");
    return;
  }

  // Busca resposta na base de conhecimento
  const { data: responses, error: findError } = await db.rpc("find_chatbot_response", {
    p_user_input: userInput,
    p_sector_id: sectorId,
  });
  if (findError) { console.error("find_chatbot_response:", findError.message); return; }
  const best = responses?.[0];

  if (!best) {
    await db.from("conversation_context").upsert({
      conversation_id: conversation.id,
      escalation_reason: "Nenhuma resposta adequada encontrada na base de conhecimento",
      bot_interaction_summary: `Cliente perguntou: "${userInput}" - Sem resposta na base`,
    }, { onConflict: "conversation_id" });
    return; // sem resposta: deixa para o atendente humano, sem poluir o cliente
  }

  await db.from("chatbot_interactions").insert({
    conversation_id: conversation.id,
    intent_detected: best.intent,
    confidence_score: best.confidence,
    knowledge_used_id: best.knowledge_id,
    user_input: userInput,
    bot_response: best.answer,
    escalated_to_human: false,
  });
  await db.from("conversation_context").upsert({
    conversation_id: conversation.id,
    bot_interaction_summary: `Bot respondeu sobre: ${best.intent || "pergunta geral"}`,
    collected_data: { lastIntent: best.intent, lastConfidence: best.confidence },
  }, { onConflict: "conversation_id" });

  await sendSystemMessage(instanceName, conversation, clientPhone, best.answer, "Assistente Virtual", "Chatbot");
}

// =====================================
// /api/fn — portes dos edge functions
// =====================================

// Cadastro público — desabilitado até o lançamento dos planos de assinatura
// (reativar com SIGNUP_ENABLED=1 no ambiente quando o fluxo de trial existir).
app.post("/api/fn/signup", async (req, res) => {
  try {
    if (process.env.SIGNUP_ENABLED !== "1") {
      return res.status(403).json({ error: "Cadastro desabilitado. Contate o administrador." });
    }
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: "email e password são obrigatórios" });
    const { data, error } = await db.auth.admin.createUser({ email, password, email_confirm: true });
    if (error) {
      const exists = /already|registered|exists/i.test(error.message);
      return res.status(exists ? 409 : 400).json({ error: exists ? "User already registered" : error.message });
    }
    res.json({ user: { id: data.user.id, email: data.user.email } });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// delete-archived — exclui definitivamente todas as conversas arquivadas (exige admin)
app.post("/api/fn/delete-archived", requireUser, async (req, res) => {
  try {
    const me = await getProfile(req.userId);
    if (!me || me.role !== "admin") return res.status(403).json({ error: "Forbidden: Admin access required" });

    const { data: archived, error: listError } = await db.from("conversations").select("id").eq("status", "archived");
    if (listError) throw listError;
    const ids = (archived || []).map((c) => c.id);
    if (!ids.length) return res.json({ deleted: 0 });

    // Tabelas sem ON DELETE CASCADE precisam ser limpas antes
    await db.from("chatbot_interactions").delete().in("conversation_id", ids);
    await db.from("conversation_context").delete().in("conversation_id", ids);
    const { error } = await db.from("conversations").delete().in("id", ids);
    if (error) throw error;

    console.log(`🗑️  ${ids.length} conversas arquivadas excluídas por ${me.name}`);
    res.json({ deleted: ids.length });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// create-attendant (exige admin)
app.post("/api/fn/create-attendant", requireUser, async (req, res) => {
  try {
    const me = await getProfile(req.userId);
    if (!me || me.role !== "admin") return res.status(403).json({ error: "Forbidden: Admin access required" });

    const { name, email, phone, password, sector_id, can_transfer, max_concurrent_chats } = req.body || {};
    if (!name || !email || !password) return res.status(400).json({ error: "name, email e password são obrigatórios" });

    const { data: authData, error: authError } = await db.auth.admin.createUser({
      email, password, email_confirm: true, user_metadata: { name },
    });
    if (authError) return res.status(400).json({ error: `Erro de autenticação: ${authError.message}` });

    const { data: profileData, error: profileError } = await db
      .from("profiles")
      .insert({
        user_id: authData.user.id,
        name, email, phone: phone || "",
        role: "attendant",
        sector_id: sector_id || null,
        can_transfer: can_transfer ?? true,
        max_concurrent_chats: max_concurrent_chats ?? 10,
        is_active: true,
        setup_completed: true,
      })
      .select()
      .single();
    if (profileError) {
      await db.auth.admin.deleteUser(authData.user.id).catch(() => {});
      return res.status(400).json({ error: `Erro ao criar perfil: ${profileError.message}` });
    }
    res.json({ success: true, profile: profileData });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// send-satisfaction-survey (link agora aponta para o próprio app)
app.post("/api/fn/send-satisfaction-survey", requireUser, async (req, res) => {
  try {
    const { conversationId } = req.body || {};
    if (!conversationId) return res.status(400).json({ error: "ID da conversa é obrigatório" });

    const { data: conversation, error } = await db
      .from("conversations")
      .select("id, client_name, client_phone, remote_jid, sector_id, instances:instance_id(instance_name, phone), sectors:sector_id(name)")
      .eq("id", conversationId)
      .single();
    if (error || !conversation) return res.status(404).json({ error: "Conversa não encontrada" });

    const { data: existing } = await db
      .from("satisfaction_survey_requests")
      .select("id")
      .eq("conversation_id", conversationId)
      .maybeSingle();
    if (existing) return res.json({ success: true, message: "Pesquisa já foi enviada para esta conversa" });

    const { data: request, error: reqError } = await db
      .from("satisfaction_survey_requests")
      .insert({ conversation_id: conversationId })
      .select("token")
      .single();
    if (reqError) return res.status(500).json({ error: "Erro ao criar solicitação de pesquisa" });

    const surveyUrl = `${APP_URL}/satisfaction-survey?token=${request.token}`;
    const clientName = conversation.client_name || "Cliente";
    const sectorName = conversation.sectors?.name || "nosso atendimento";
    const surveyMessage = `Olá ${clientName}! 👋\n\nEsperamos que tenha ficado satisfeit@ com o atendimento do setor de ${sectorName}.\n\nSua opinião é muito importante para nós!\n\nPor favor, avalie nosso atendimento clicando no link abaixo:\n${surveyUrl}\n\n⭐ A avaliação leva apenas 30 segundos\n🔒 Sua resposta é totalmente confidencial\n💙 Obrigado por nos ajudar a melhorar!\n\n_Esta pesquisa expira em 7 dias._`;

    try {
      await waSend(conversation.instances.instance_name, conversation.remote_jid || conversation.client_phone, surveyMessage);
    } catch (e) {
      console.error("Envio da pesquisa via whatsai falhou:", e.message);
    }
    res.json({ success: true, message: "Pesquisa de satisfação enviada com sucesso", surveyUrl });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// chatbot-processor (mantido por compatibilidade; o fluxo principal roda no webhook)
app.post("/api/fn/chatbot-processor", requireUser, async (req, res) => {
  try {
    const { conversationId, userInput, sectorId, clientPhone } = req.body || {};
    const { data: conversation } = await db
      .from("conversations")
      .select("id, status, assigned_to, sector_id, instances:instance_id(instance_name)")
      .eq("id", conversationId)
      .single();
    if (!conversation) return res.status(404).json({ success: false, error: "Conversa não encontrada" });
    await processChatbot(conversation.instances?.instance_name, { ...conversation, sector_id: sectorId || conversation.sector_id }, userInput, clientPhone);
    res.json({ success: true, shouldEscalate: false });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message, shouldEscalate: true });
  }
});

// Healthcheck
app.get("/healthz", async (req, res) => {
  const out = { app: "ok", whatsai: "unknown", supabase: "unknown" };
  try {
    const r = await fetch(`${WHATSAI_URL}/ping`);
    out.whatsai = r.ok ? "ok" : `http ${r.status}`;
  } catch (e) { out.whatsai = e.message; }
  try {
    const { error } = await db.from("sectors").select("id").limit(1);
    out.supabase = error ? error.message : "ok";
  } catch (e) { out.supabase = e.message; }
  res.json(out);
});

// ── Frontend estático (SPA) ──
const DIST = path.join(__dirname, "..", "dist");
app.use(express.static(DIST));
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api/") || req.path.startsWith("/webhook/")) return next();
  res.sendFile(path.join(DIST, "index.html"));
});

// Varredura de arquivamento: conversas sem atividade há ARCHIVE_AFTER_DAYS
// viram 'archived' (saem da lista; nova mensagem do cliente reabre como 'new').
async function archiveInactiveConversations() {
  if (!ARCHIVE_AFTER_DAYS) return;
  const cutoff = new Date(Date.now() - ARCHIVE_AFTER_DAYS * 86400000).toISOString();
  const { data, error } = await db
    .from("conversations")
    .update({ status: "archived", assigned_to: null })
    .neq("status", "archived")
    .lt("last_message_at", cutoff)
    .select("id");
  if (error) console.error("❌ Auto-arquivamento:", error.message);
  else if (data?.length) console.log(`🗄️  ${data.length} conversas arquivadas por inatividade (> ${ARCHIVE_AFTER_DAYS} dias)`);
}

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Nutef Chat Central bridge na porta ${PORT}`);
  console.log(`   whatsai: ${WHATSAI_URL} | supabase: ${SUPABASE_URL} (schema ${DB_SCHEMA})`);
  console.log(`   webhook: ${WEBHOOK_URL}`);
  archiveInactiveConversations();
  setInterval(archiveInactiveConversations, 6 * 3600 * 1000);
});
