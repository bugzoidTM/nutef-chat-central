
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Edit3, UserCheck, UserX, MoreHorizontal, Phone, Mail } from 'lucide-react';
import type { Attendant } from '@/hooks/useAttendants';

interface AttendantTableProps {
  attendants: Attendant[];
  onEdit: (attendant: Attendant) => void;
  onToggle: (attendant: Attendant) => void;
}

export const AttendantTable: React.FC<AttendantTableProps> = ({
  attendants,
  onEdit,
  onToggle,
}) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Atendente</TableHead>
          <TableHead>Setor</TableHead>
          <TableHead>Contato</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Limites</TableHead>
          <TableHead className="text-right">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {attendants.map((attendant) => (
          <TableRow key={attendant.id}>
            <TableCell>
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs">
                    {attendant.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">{attendant.name}</div>
                  <div className="text-sm text-gray-500">{attendant.email}</div>
                </div>
              </div>
            </TableCell>
            
            <TableCell>
              {attendant.sector ? (
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: attendant.sector.color }}
                  />
                  <span className="text-sm">{attendant.sector.name}</span>
                </div>
              ) : (
                <Badge variant="outline">Sem setor</Badge>
              )}
            </TableCell>
            
            <TableCell>
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-sm">
                  <Phone className="h-3 w-3" />
                  {attendant.phone}
                </div>
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <Mail className="h-3 w-3" />
                  {attendant.email}
                </div>
              </div>
            </TableCell>
            
            <TableCell>
              <Badge variant={attendant.is_active ? 'default' : 'secondary'}>
                {attendant.is_active ? 'Ativo' : 'Inativo'}
              </Badge>
            </TableCell>
            
            <TableCell>
              <div className="text-sm space-y-1">
                <div>Max: {attendant.max_concurrent_chats} chats</div>
                <div className="text-gray-500">
                  {attendant.can_transfer ? 'Pode transferir' : 'Não pode transferir'}
                </div>
              </div>
            </TableCell>
            
            <TableCell className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit(attendant)}>
                    <Edit3 className="h-4 w-4 mr-2" />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onToggle(attendant)}>
                    {attendant.is_active ? (
                      <UserX className="h-4 w-4 mr-2" />
                    ) : (
                      <UserCheck className="h-4 w-4 mr-2" />
                    )}
                    {attendant.is_active ? 'Desativar' : 'Ativar'}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
