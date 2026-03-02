type RoleSource = {
  __source?: 'local' | 'aura';
  creator?: {
    role?: { slug?: string; name?: string } | null;
    role_id?: number | null;
  } | null;
  money_holder?: 'company' | 'agent' | 'owner' | 'developer' | 'client' | string | null;
  is_from_developer?: boolean | null;
  developer_id?: number | string | null;
  is_business_owner?: boolean | null;
  owner_name?: string | null;
  owner_phone?: string | null;
  agent_id?: number | string | null;
};

const HOLDER_LABELS: Record<string, string> = {
  owner: 'Собственник',
  developer: 'Застройщик',
  agent: 'Риэлтор',
  company: 'Компания',
  client: 'Клиент',
};

export function getContactRoleLabel(entity: RoleSource): string {
  if (entity.__source === 'aura') return 'Риэлтор';

  const creatorRoleName = entity.creator?.role?.name?.trim?.();
  if (creatorRoleName) return creatorRoleName;

  const creatorRoleSlug = entity.creator?.role?.slug?.toLowerCase?.();
  if (creatorRoleSlug) {
    if (creatorRoleSlug === 'agent') return 'Риэлтор';
    if (creatorRoleSlug === 'developer') return 'Застройщик';
    if (creatorRoleSlug === 'user' || creatorRoleSlug === 'client') return 'Собственник';
  }

  if (entity.money_holder && HOLDER_LABELS[entity.money_holder]) {
    return HOLDER_LABELS[entity.money_holder];
  }

  if (entity.is_from_developer || !!entity.developer_id) return 'Застройщик';
  if (entity.is_business_owner || !!entity.owner_name || !!entity.owner_phone) return 'Собственник';
  if (entity.agent_id) return 'Риэлтор';

  return 'Собственник';
}
