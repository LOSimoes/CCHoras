# Controle de Horas de Motorista

Esta é uma aplicação web full-stack projetada para ajudar motoristas e outros profissionais a registrar e gerenciar suas horas de trabalho diárias. A ferramenta oferece uma interface simples para adicionar horas, visualizar resumos semanais e mensais, e exportar relatórios. Inclui também um sistema de autenticação e um painel de administração para gerenciamento de usuários e configurações.

O frontend foi recentemente refatorado para usar ES Modules, resultando em um código mais organizado, manutenível e desacoplado. A aplicação é totalmente containerizada com Docker, facilitando a configuração e a execução em qualquer ambiente.

## ✨ Funcionalidades Principais

*   **Autenticação de Usuário:** Sistema seguro de registro e login com senhas criptografadas (bcrypt) e sessões gerenciadas por JSON Web Tokens (JWT).
*   **Registro de Horas:** Adicione, edite e salve as horas trabalhadas em qualquer dia com um formulário dinâmico.
*   **Visualização de Dados:**
    *   Veja o total de horas para um dia específico.
    *   Acompanhe o resumo de horas totais no mês corrente.
    *   Analise a distribuição de horas na semana através de um gráfico de barras interativo.
*   **Exportação de Dados:** Exporte o relatório de horas de um mês completo para um arquivo `.csv`, pronto para ser aberto em planilhas.
*   **Pedidos de Folga:** Usuários podem solicitar dias de folga, que ficam pendentes para aprovação de um administrador.
*   **Painel de Administração:**
    *   **Gerenciamento de Folgas:** Visualize, aprove, negue ou exclua os pedidos de folga de todos os usuários.
    *   **Gerenciamento de Usuários:** Liste todos os usuários cadastrados e edite suas informações (nome de usuário e senha).
    *   **Configurações Globais:** Defina regras para a aplicação, como o limite de pedidos de folga que um usuário pode fazer por mês.

## 🛠️ Tecnologias Utilizadas

O projeto é dividido em três serviços principais, orquestrados pelo Docker Compose:

*   **Frontend:**
    *   **HTML5, CSS3, JavaScript (Puro/Vanilla):** Para uma interface leve e sem dependência de frameworks.
    *   **Chart.js:** Para a criação de gráficos dinâmicos.
    *   **Nginx:** Servidor web de alta performance para servir os arquivos estáticos e atuar como proxy reverso para a API.

*   **Backend:**
    *   **Node.js:** Ambiente de execução para o JavaScript no servidor.
    *   **Express.js:** Framework minimalista para a construção da API REST.
    *   **MongoDB:** Banco de dados NoSQL para armazenar os dados de usuários e horas.
    *   **jsonwebtoken (JWT):** Para gerar tokens de autenticação seguros.
    *   **bcrypt:** Para criptografar as senhas dos usuários antes de salvá-las no banco.

*   **Infraestrutura:**
    *   **Docker & Docker Compose:** Para criar ambientes de desenvolvimento e produção consistentes e isolados.

## 🚀 Como Executar o Projeto Localmente

### Pré-requisitos

*   Docker
*   Docker Compose (geralmente já vem com o Docker Desktop)

### Passos

1.  **Clone o repositório:**
    ```bash
    git clone https://github.com/LOSimoes/CCHoras.git
    cd CCHoras
    ```

2.  **Configure as Variáveis de Ambiente:**
    Crie um arquivo chamado `.env` na raiz do projeto. Este arquivo guardará suas variáveis de ambiente secretas e não será enviado para o GitHub.

    Copie o conteúdo abaixo para o seu arquivo `.env`:

    ```bash
    # .env
    # Substitua o valor abaixo por um segredo forte, longo e aleatório.
    # Você pode usar um gerador de senhas online para criar um.
    JWT_SECRET="seu-segredo-super-secreto-e-longo-aqui-gerado-aleatoriamente"
    ```
    O arquivo `.gitignore` do projeto já está configurado para ignorar o arquivo `.env`, garantindo que ele não seja exposto.

3.  **Inicie os contêineres:**
    Execute o comando a seguir na raiz do projeto. O argumento `--build` garante que as imagens Docker serão construídas a partir dos `Dockerfiles` na primeira vez. O `-d` executa os contêineres em modo "detached" (em segundo plano).

    ```bash
    docker-compose up --build -d
    ```

4.  **Acesse a aplicação:**
    Após os contêineres iniciarem, abra seu navegador e acesse:
    **http://localhost:8080**

    Você pode se registrar com um novo usuário e começar a usar a aplicação. O primeiro usuário registrado não é um administrador.

5.  **Para parar a aplicação:**
    Quando terminar, execute o comando a seguir para parar e remover os contêineres, redes e volumes criados.

    ```bash
    docker-compose down
    ```
