import "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      firstName: string
      lastName: string
      name: string
      email?: string
      image?: string
    }
  }
}
