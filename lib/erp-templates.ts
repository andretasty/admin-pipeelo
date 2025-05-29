import type { ERPTemplate } from "@/types"

export const ERP_TEMPLATES: ERPTemplate[] = [
  {
    id: "protheus",
    name: "TOTVS Protheus",
    version: "1.0.0",
    description: "Template para integração com TOTVS Protheus via REST API",
    logo: "/erp-logos/protheus.png",
    integration_fields: [
      {
        name: "base_url",
        type: "url",
        label: "URL Base do Sistema",
        required: true,
        placeholder: "https://sua-empresa.protheus.com.br"
      },
      {
        name: "api_token",
        type: "password",
        label: "Token de API",
        required: true,
        placeholder: "Bearer token para autenticação"
      },
      {
        name: "environment",
        type: "text",
        label: "Ambiente",
        required: true,
        placeholder: "ENVIRONMENT=PROD"
      }
    ],
    commands: [
      {
        name: "get_client_data",
        description: "Buscar dados do cliente por código",
        script: `
const response = await axios.get(\`\${config.base_url}/rest/sa1010/\`, {
  headers: {
    'Authorization': config.api_token,
    'Content-Type': 'application/json'
  },
  params: {
    A1_COD: parameters.client_code
  }
});
return response.data;
        `,
        parameters: ["client_code"],
        response_format: {
          client_id: "string",
          name: "string",
          document: "string",
          email: "string"
        }
      },
      {
        name: "get_products",
        description: "Listar produtos disponíveis",
        script: `
const response = await axios.get(\`\${config.base_url}/rest/sb1010/\`, {
  headers: {
    'Authorization': config.api_token,
    'Content-Type': 'application/json'
  }
});
return response.data.objects;
        `,
        parameters: [],
        response_format: {
          products: "array"
        }
      },
      {
        name: "create_order",
        description: "Criar pedido de venda",
        script: `
const response = await axios.post(\`\${config.base_url}/rest/sc5010/\`, {
  C5_CLIENTE: parameters.client_code,
  C5_LOJA: parameters.store_code,
  C5_EMISSAO: new Date().toISOString().split('T')[0].replace(/-/g, ''),
  items: parameters.items
}, {
  headers: {
    'Authorization': config.api_token,
    'Content-Type': 'application/json'
  }
});
return response.data;
        `,
        parameters: ["client_code", "store_code", "items"],
        response_format: {
          order_id: "string",
          status: "string"
        }
      }
    ]
  },
  {
    id: "sap",
    name: "SAP Business One",
    version: "1.0.0",
    description: "Template para integração com SAP Business One via Service Layer",
    logo: "/erp-logos/sap.png",
    integration_fields: [
      {
        name: "server_url",
        type: "url",
        label: "URL do Service Layer",
        required: true,
        placeholder: "https://servidor:50000/b1s/v1"
      },
      {
        name: "database",
        type: "text",
        label: "Nome da Base de Dados",
        required: true,
        placeholder: "SBODemoUS"
      },
      {
        name: "username",
        type: "text",
        label: "Usuário",
        required: true,
        placeholder: "manager"
      },
      {
        name: "password",
        type: "password",
        label: "Senha",
        required: true,
        placeholder: "Senha do usuário SAP"
      }
    ],
    commands: [
      {
        name: "login",
        description: "Autenticar no SAP Service Layer",
        script: `
const response = await axios.post(\`\${config.server_url}/Login\`, {
  CompanyDB: config.database,
  UserName: config.username,
  Password: config.password
});
return { sessionId: response.data.SessionId };
        `,
        parameters: [],
        response_format: {
          sessionId: "string"
        }
      },
      {
        name: "get_business_partners",
        description: "Buscar parceiros de negócio",
        script: `
const response = await axios.get(\`\${config.server_url}/BusinessPartners\`, {
  headers: {
    'Cookie': \`B1SESSION=\${parameters.sessionId}\`
  },
  params: {
    '$filter': \`CardName eq '\${parameters.name}'\`
  }
});
return response.data;
        `,
        parameters: ["sessionId", "name"],
        response_format: {
          value: "array"
        }
      },
      {
        name: "get_items",
        description: "Buscar itens/produtos",
        script: `
const response = await axios.get(\`\${config.server_url}/Items\`, {
  headers: {
    'Cookie': \`B1SESSION=\${parameters.sessionId}\`
  }
});
return response.data;
        `,
        parameters: ["sessionId"],
        response_format: {
          value: "array"
        }
      }
    ]
  },
  {
    id: "oracle",
    name: "Oracle ERP Cloud",
    version: "1.0.0",
    description: "Template para integração com Oracle ERP Cloud via REST API",
    logo: "/erp-logos/oracle.png",
    integration_fields: [
      {
        name: "instance_url",
        type: "url",
        label: "URL da Instância",
        required: true,
        placeholder: "https://sua-empresa.oraclecloud.com"
      },
      {
        name: "username",
        type: "text",
        label: "Usuário",
        required: true,
        placeholder: "usuario@empresa.com"
      },
      {
        name: "password",
        type: "password",
        label: "Senha",
        required: true,
        placeholder: "Senha do Oracle Cloud"
      }
    ],
    commands: [
      {
        name: "get_customers",
        description: "Buscar clientes",
        script: `
const auth = btoa(\`\${config.username}:\${config.password}\`);
const response = await axios.get(\`\${config.instance_url}/fscmRestApi/resources/11.13.18.05/customers\`, {
  headers: {
    'Authorization': \`Basic \${auth}\`,
    'Content-Type': 'application/json'
  }
});
return response.data;
        `,
        parameters: [],
        response_format: {
          items: "array"
        }
      }
    ]
  },
  {
    id: "custom",
    name: "ERP Personalizado",
    version: "1.0.0",
    description: "Template genérico para ERPs com API REST customizada",
    logo: "/erp-logos/custom.png",
    integration_fields: [
      {
        name: "api_base_url",
        type: "url",
        label: "URL Base da API",
        required: true,
        placeholder: "https://api.seuerp.com/v1"
      },
      {
        name: "api_key",
        type: "password",
        label: "Chave da API",
        required: true,
        placeholder: "Sua API Key"
      }
    ],
    commands: [
      {
        name: "test_connection",
        description: "Testar conexão com a API",
        script: `
const response = await axios.get(\`\${config.api_base_url}/health\`, {
  headers: {
    'Authorization': \`Bearer \${config.api_key}\`,
    'Content-Type': 'application/json'
  }
});
return { status: 'connected', data: response.data };
        `,
        parameters: [],
        response_format: {
          status: "string",
          data: "object"
        }
      }
    ]
  }
]

export const getERPTemplate = (id: string): ERPTemplate | undefined => {
  return ERP_TEMPLATES.find(template => template.id === id)
}

export const getERPTemplatesByCategory = (category?: string): ERPTemplate[] => {
  if (!category) return ERP_TEMPLATES
  // Implementar filtro por categoria quando necessário
  return ERP_TEMPLATES
}
