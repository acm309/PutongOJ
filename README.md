# Putong OJ

[![Node.JS](https://img.shields.io/badge/node-%3E=20-417e38.svg)](https://nodejs.org/)
[![Test Status](https://img.shields.io/github/actions/workflow/status/net-escape/putong-oj/backend-test.yml?label=test)](https://github.com/net-escape/putong-oj/actions/workflows/backend-test.yml)
[![Codecov](https://img.shields.io/codecov/c/github/net-escape/putong-oj/main)](https://app.codecov.io/github/net-escape/putong-oj)
[![GitHub License](https://img.shields.io/github/license/net-escape/putong-oj)](https://github.com/net-escape/putong-oj/blob/main/LICENSE)

Putong OJ is an online judge system designed for competitive programming and algorithmic problem-solving. A live instance is available at [acm.cjlu.edu.cn](https://acm.cjlu.edu.cn/).

> [!IMPORTANT]
> 
> The development of Putong OJ is closely tailored to the practical needs of the ACM Lab at CJLU, incorporating numerous customized features. 
> 
> If you wish to deploy your own instance, we recommend forking the repository and modifying the code according to your requirements. Currently, Putong OJ does not support configuration options for these customized features.

> [!CAUTION]  
>   
> The current branch may contain untested changes after dependency upgrades and a project structure refactor. For production use, we strongly recommend using the last stable version: **backend** at commit [`6c7b68c`](https://github.com/net-escape/putong-oj/tree/6c7b68c183af0ba0a5512ff273c1955d250cc892) and **frontend** at commit [`ce13bf1`](https://github.com/net-escape/putong-oj/tree/ce13bf1988bb4923947b9b72a0b8a371d3110469).
>   
> Some features might be unstable until comprehensive testing is completed. Proceed with caution when deploying this version.

## Features ✨

- **One-Click Deployment** – Easily deploy with Docker.
- **Modern Web Interface** – Built as a single-page application (SPA) using Vue.js.
- **Scalable Architecture** – Backed by Koa.js, MongoDB, and Redis for optimal performance.
- **Multiple Testcases Support** – Run and evaluate submissions with multiple testcases.
- **Flexible Judging System** – Supports various programming languages.
- **Real-Time Status Updates** – Monitor submissions and results dynamically.
- **Contest Mode** – Conduct coding contests with live rankings and scoreboard.
- **Submission History** – Track past submissions with insights.
- **Code Execution Sandbox** – Secure environment to prevent malicious execution.
- **RESTful API Support** – Extend functionality with API integrations.
- *And much more...*

## Getting Started 🚀

### Prerequisites

Before proceeding, ensure that you have the following installed:
- [Docker](https://www.docker.com/)
- [MongoDB](https://www.mongodb.com/)
- [Redis](https://redis.io/)

### Build and Run

#### Build Docker Image

Run the following command to build the Docker image:

```bash
docker build -t ptoj-app .
```

#### Run the Application

Replace `<YOUR_MONGODB_URL>` and `<YOUR_REDIS_URL>` with your actual database connection URLs:

```bash
docker run -d --name ptoj-app \
    -p 3000:3000 \
    -e NODE_ENV=production \
    -e dbURL=<YOUR_MONGODB_URL> \
    -e redisURL=<YOUR_REDIS_URL> \
    ptoj-app
```

This will start the application on port `3000`.

### Persistent Data Storage

To retain data across container restarts, mount the following volumes:

```plaintext
/app/data
/app/logs
/app/public/uploads
```

### Setting Up the Judger

To configure the judging system, refer to [ptoj-judger](https://github.com/net-escape/ptoj-judger).

## License 📜

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for more details.
