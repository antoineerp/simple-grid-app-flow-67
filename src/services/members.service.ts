
// Service de gestion des membres
import { apiClient } from '@/lib/api';
import { Member } from '@/types';

class MembersService {
  async getMembers(): Promise<Member[]> {
    try {
      const response = await apiClient.get<Member[]>('/membres-load.php');
      
      if (response.success && response.data) {
        return response.data.map(this.transformMember);
      }
      
      return [];
    } catch (error) {
      console.error('Error loading members:', error);
      throw error;
    }
  }

  async createMember(member: Omit<Member, 'id' | 'date_creation'>): Promise<Member> {
    try {
      const newMember = {
        ...member,
        id: crypto.randomUUID(),
        date_creation: new Date(),
        initiales: this.generateInitials(member.nom, member.prenom)
      };

      const response = await apiClient.post<Member>('/membres-sync.php', {
        membres: [newMember]
      });

      if (response.success) {
        return newMember;
      }

      throw new Error(response.message || 'Erreur lors de la création');
    } catch (error) {
      console.error('Error creating member:', error);
      throw error;
    }
  }

  async updateMember(member: Member): Promise<Member> {
    try {
      const response = await apiClient.put<Member>(`/membres-sync.php`, {
        membres: [member]
      });

      if (response.success) {
        return member;
      }

      throw new Error(response.message || 'Erreur lors de la mise à jour');
    } catch (error) {
      console.error('Error updating member:', error);
      throw error;
    }
  }

  async deleteMember(id: string): Promise<void> {
    try {
      const response = await apiClient.delete(`/membres/${id}`);
      
      if (!response.success) {
        throw new Error(response.message || 'Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Error deleting member:', error);
      throw error;
    }
  }

  private transformMember(data: any): Member {
    return {
      id: data.id || crypto.randomUUID(),
      nom: data.nom || '',
      prenom: data.prenom || '',
      email: data.email,
      telephone: data.telephone,
      fonction: data.fonction || '',
      organisation: data.organisation,
      notes: data.notes,
      initiales: data.initiales || this.generateInitials(data.nom, data.prenom),
      date_creation: data.date_creation ? new Date(data.date_creation) : new Date()
    };
  }

  private generateInitials(nom: string, prenom: string): string {
    const n = nom?.charAt(0)?.toUpperCase() || '';
    const p = prenom?.charAt(0)?.toUpperCase() || '';
    return `${p}${n}`;
  }
}

export const membersService = new MembersService();
