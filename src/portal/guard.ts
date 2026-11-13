export type PortalUser = {
  uid: string
}

export async function requireClient(
  getUser: () => Promise<PortalUser | null>,
  onUnauthenticated: () => void,
): Promise<PortalUser | null> {
  const user = await getUser()
  if (!user) {
    onUnauthenticated()
    return null
  }
  return user
}
