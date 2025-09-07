export interface Client {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  whatsapp: string;
  createdAt: Date;
}

export const mockClients: Client[] = [
  {
    id: "1",
    firstName: "Valdenir",
    lastName: "Lourenço Martins",
    email: "valdenir@email.com",
    whatsapp: "+5567999123456",
    createdAt: new Date("2025-01-01"),
  },
  {
    id: "2", 
    firstName: "Ketllen Samara",
    lastName: "Rodrigues Lemos Romanini",
    email: "ketllen@email.com",
    whatsapp: "+5567999654321",
    createdAt: new Date("2025-01-02"),
  },
  {
    id: "3",
    firstName: "Joana",
    lastName: "Darc Ferreira Borges",
    email: "joana@email.com",
    whatsapp: "+5567999789012",
    createdAt: new Date("2025-01-03"),
  },
];