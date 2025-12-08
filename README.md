# 🎓 Ouvidoria SENAI Suíço-Brasileira

Sistema web de ouvidoria desenvolvido para a Escola SENAI Suíço-Brasileira, permitindo que alunos, funcionários e a comunidade escolar registrem manifestações (denúncias, reclamações, elogios e sugestões) de forma transparente e organizada.

## 📋 Sobre o Projeto

A Ouvidoria SENAI é uma plataforma completa que facilita a comunicação entre a comunidade escolar e a administração, garantindo transparência, imparcialidade e acompanhamento de todas as manifestações registradas.

### ✨ Funcionalidades Principais

#### Para Usuários
- 📝 Registro de manifestações (Denúncia, Reclamação, Elogio, Sugestão)
- 📎 Anexo de imagens e documentos
- 🔍 Acompanhamento do status das manifestações
- 🔐 Sistema de autenticação seguro
- 👁️ Visualização de senha nos formulários
- 📱 Interface totalmente responsiva

#### Para Administradores
- 📊 Painéis administrativos por área (Geral, Mecânica, Informática, Faculdade)
- ✅ Gerenciamento de manifestações
- 💬 Sistema de resposta às manifestações
- 📈 Métricas e estatísticas em tempo real
- 🔄 Atualização de status
- 🗂️ Organização por setor e tipo

#### Para Funcionários
- 📋 Visualização de manifestações próprias
- 📊 Dashboard com resumo de manifestações
- 🔔 Acompanhamento de respostas da administração

## 🚀 Tecnologias Utilizadas

- **Frontend:** React 18.2.0
- **Roteamento:** React Router DOM 6.22.3
- **Estilização:** CSS3 com design responsivo
- **Autenticação:** Sistema próprio com tokens JWT
- **Deploy:** Vercel
- **Versionamento:** Git & GitHub

## 📦 Instalação e Configuração

### Pré-requisitos

- Node.js (versão 14 ou superior)
- npm ou yarn
- Git

### Passo a Passo

1. **Clone o repositório**
```bash
git clone https://github.com/seu-usuario/ouvidoria-senai.git
cd ouvidoria-senai
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure as variáveis de ambiente**

Crie um arquivo `.env` na raiz do projeto:
```env
REACT_APP_API_BASE=http://localhost:8080
```

4. **Inicie o servidor de desenvolvimento**
```bash
npm start
```

O aplicativo estará disponível em `http://localhost:3000`

## 🏗️ Estrutura do Projeto

```
ouvidoria-senai/
├── public/
│   ├── index.html
│   └── assets/
├── src/
│   ├── Components/
│   │   ├── Header.js
│   │   ├── Footer.js
│   │   ├── Dropdown.js
│   │   ├── ModalLogin.js
│   │   ├── ModalCadastro.js
│   │   ├── ModalGerenciar.js
│   │   └── BotaoOuvidoria.js
│   ├── pages/
│   │   ├── Home/
│   │   ├── Aluno/
│   │   ├── Funcionario/
│   │   ├── Admin/
│   │   ├── AdmMecan/
│   │   ├── AdmInfo/
│   │   ├── AdmFac/
│   │   ├── Denuncia/
│   │   ├── Reclamacao/
│   │   ├── Elogio/
│   │   └── Sugestao/
│   ├── services/
│   │   ├── api.js
│   │   ├── manifestacoesService.js
│   │   └── CrudService.js
│   ├── assets/
│   │   └── imagens/
│   ├── App.js
│   └── index.js
├── .env
├── package.json
└── README.md
```

## 🎨 Funcionalidades Detalhadas

### Sistema de Manifestações

#### Tipos de Manifestação
- **Denúncia:** Para relatar irregularidades ou comportamentos inadequados
- **Reclamação:** Para expressar insatisfação com serviços ou situações
- **Elogio:** Para reconhecer boas práticas e atitudes positivas
- **Sugestão:** Para propor melhorias e novas ideias

#### Campos Obrigatórios
- Local do incidente
- Data e hora (com restrição de datas futuras)
- Descrição detalhada
- Setor responsável

### Painéis Administrativos

#### Admin Geral
- Acesso total a todas as manifestações
- Gerenciamento de todos os setores
- Métricas globais

#### Admin por Área
- **Mecânica:** Manifestações relacionadas à área de mecânica
- **Informática:** Manifestações de TI, ADS e Redes
- **Faculdade:** Manifestações da faculdade SENAI

### Sistema de Autenticação

#### Tipos de Usuário
- **Aluno:** Email @aluno.senai.br
- **Funcionário:** Email @senai.br, @docente.senai.br, @sp.senai.br
- **Administrador:** Emails específicos por área

#### Funcionalidades de Segurança
- Autenticação via JWT
- Tokens de refresh
- Validação de domínios de email
- Proteção de rotas
- Visualização de senha com ícone de olho

## 📱 Responsividade

O sistema é totalmente responsivo e otimizado para:
- 📱 Smartphones (360px - 480px)
- 📱 Tablets (768px - 1024px)
- 💻 Desktops (1024px+)

### Breakpoints Implementados
- **360px:** Smartphones muito pequenos
- **480px:** Smartphones
- **768px:** Tablets pequenos
- **1024px:** Tablets e telas médias

## 🔒 Segurança

- Validação de dados no frontend e backend
- Proteção contra injeção de código
- Sanitização de inputs
- Autenticação baseada em tokens
- Validação de domínios de email institucionais
- Restrição de datas futuras em formulários

## 🚀 Deploy

### Vercel (Recomendado)

1. Conecte seu repositório GitHub ao Vercel
2. Configure as variáveis de ambiente
3. O deploy será automático a cada push na branch principal

### Build Manual

```bash
npm run build
```

Os arquivos otimizados estarão na pasta `build/`

## 📝 Licença

Este projeto foi desenvolvido como Trabalho de Conclusão de Curso (TCC) para a Escola SENAI Suíço-Brasileira.

## 👥 Autores

Desenvolvido por [@projetoMadruga](https://github.com/projetoMadruga) e alunos do curso de Análise e Desenvolvimento de Sistemas - SENAI Suíço-Brasileira
- [@igoormaurilio](https://github.com/igoormaurilio)
- [@AnaaPds](https://github.com/AnaaPds)
- [@LuisCantieri](https://github.com/LuisCantieri)
- [@julioperes41](https://github.com/julioperes41)
- [@Lsdceo](https://github.com/Lsdceo)
- [@GustavoGomes-dev](https://github.com/GustavoGomes-dev)



## 📞 Contato

Para dúvidas ou sugestões sobre o projeto, entre em contato através da ouvidoria da escola.

---
 Se este projeto foi útil para você, considere dar uma estrela no repositório!
