# Controle de Horas de Motorista

Esta é uma aplicação web full-stack projetada para ajudar motoristas e outros profissionais a registrar e gerenciar suas horas de trabalho diárias. A ferramenta oferece uma interface simples para adicionar horas, visualizar resumos semanais e mensais, e exportar relatórios. Inclui também um sistema de autenticação e um painel de administração para gerenciamento de usuários e configurações.

O frontend foi recentemente refatorado para usar ES Modules, resultando em um código mais organizado, manutenível e desacoplado. A aplicação é totalmente containerizada com Docker e otimizada para deploy na Google Cloud Platform.

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

## ☁️ Arquitetura de Produção (Google Cloud)

A aplicação é projetada para ser implantada em uma arquitetura moderna, escalável e de baixo custo na Google Cloud Platform:

*   **Frontend (Nginx) e Backend (Node.js):** Ambos os serviços são implantados como contêineres independentes no **Cloud Run**, um serviço serverless que escala automaticamente, inclusive para zero, otimizando custos.
*   **Banco de Dados:** Utiliza o **MongoDB Atlas**, um serviço de banco de dados totalmente gerenciado, com integração nativa com a GCP.
*   **Imagens Docker:** As imagens dos contêineres são armazenadas de forma segura no **Artifact Registry**.
*   **Gerenciamento de Segredos:** Senhas e chaves de API são gerenciadas de forma segura pelo **Secret Manager**.
*   **CI/CD:** Um pipeline automatizado com o **Cloud Build** é configurado para construir, testar e implantar a aplicação a cada `git push` na branch `main`.

## 🛠️ Tecnologias Utilizadas

*   **Frontend:**
    *   **HTML5, CSS3, JavaScript (Vanilla):** Para uma interface leve e sem dependência de frameworks.
    *   **Chart.js:** Para a criação de gráficos dinâmicos.

*   **Backend:**
    *   **Node.js:** Ambiente de execução para o JavaScript no servidor.
    *   **Express.js:** Framework minimalista para a construção da API REST.
    *   **jsonwebtoken (JWT):** Para gerar tokens de autenticação seguros.
    *   **bcrypt:** Para criptografar as senhas dos usuários antes de salvá-las no banco.

*   **Banco de Dados:**
    *   **MongoDB:** Banco de dados NoSQL para armazenar os dados de usuários e horas.

*   **Infraestrutura e DevOps:**
    *   **Local:** Docker, Docker Compose, Nginx
    *   **Nuvem (GCP):** Cloud Run, Artifact Registry, Cloud Build, Secret Manager

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
    O arquivo `.gitignore` do projeto já está configurado para ignorar o arquivo `.env`.

3.  **Gere o `package-lock.json`:**
    O build do Docker para produção usa `npm ci`, que exige o `package-lock.json`. Execute o comando abaixo para gerá-lo usando o Docker, sem precisar instalar o Node.js na sua máquina.
    ```bash
    docker run --rm -v "$(pwd)/backend:/usr/src/app" -w /usr/src/app node:18-alpine npm install
    ```

4.  **Inicie os contêineres:**
    Execute o comando a seguir na raiz do projeto. O argumento `--build` garante que as imagens Docker serão construídas a partir dos `Dockerfiles` na primeira vez. O `-d` executa os contêineres em modo "detached" (em segundo plano).

    ```bash
    docker-compose up --build -d
    ```

5.  **Acesse a aplicação:**
    Após os contêineres iniciarem, abra seu navegador e acesse:
    **http://localhost:8080**

    Você pode se registrar com um novo usuário e começar a usar a aplicação. O primeiro usuário registrado não é um administrador.

6.  **Para parar a aplicação:**
    Quando terminar, execute o comando a seguir para parar e remover os contêineres, redes e volumes criados.

    ```bash
    docker-compose down
    ```
