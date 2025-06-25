# Putong OJ - Frontend

[![Vue.js](https://img.shields.io/github/package-json/dependency-version/net-escape/ptoj-frontend/vue?color=42b883
)](https://vuejs.org/)
[![Axios](https://img.shields.io/github/package-json/dependency-version/net-escape/ptoj-frontend/axios?color=5a29e4)](https://axios-http.com/)
[![Pinia](https://img.shields.io/github/package-json/dependency-version/net-escape/ptoj-frontend/pinia?color=c99513)](https://pinia.vuejs.org/)
[![View UI Plus](https://img.shields.io/github/package-json/dependency-version/net-escape/ptoj-frontend/view-ui-plus?color=2d8cf0)](https://www.iviewui.com/)

The frontend component of [Putong OJ](https://github.com/net-escape/ptoj-backend), a modern single-page application built with Vue. A live instance is available at [acm.cjlu.edu.cn](https://acm.cjlu.edu.cn/).

> [!IMPORTANT]
> 
> The development of Putong OJ is closely tailored to the practical needs of the ACM Lab at CJLU, incorporating numerous customized features. 
> 
> If you wish to deploy your own instance, we recommend forking the repository and modifying the code according to your requirements. Currently, Putong OJ does not support configuration options for these customized features.

> [!CAUTION]  
>   
> The current branch may contain untested changes after dependency upgrades. For production use, we strongly recommend using the last stable version from commit [`ce13bf1`](https://github.com/net-escape/ptoj-frontend/commit/ce13bf1988bb4923947b9b72a0b8a371d3110469).  
>   
> Some features might be unstable until comprehensive testing is completed. Proceed with caution when deploying this version.

## Getting Started 🚀

### Installation

```bash
pnpm install
```

### Development

```bash
pnpm run dev
```

### Building for Production

```bash
pnpm run build
```

### Customizing Styles

Modify these files to change the visual appearance:
- `src/theme/index.less`
- `src/styles/common.styl`
