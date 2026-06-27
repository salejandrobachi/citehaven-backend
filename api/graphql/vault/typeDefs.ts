export const vaultTypeDefs = `#graphql
  type Vault {
    id: ID!
    title: String!
    createdAt: DateTime!
  }

  type Query {
    vaults: [Vault!]!
    vault(id: ID!): Vault
  }

  type Mutation {
    createVault(title: String!): Vault!
    updateVault(id: ID!, title: String!): Vault!
    deleteVault(id: ID!): Vault!
  }
`;