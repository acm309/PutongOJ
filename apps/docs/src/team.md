<script setup>
import { VPTeamMembers } from 'vitepress/theme'

// https://vitepress.dev/zh/reference/default-theme-team-page
const members = [
  {
    avatar: 'https://github.com/lazzzis.png',
    name: 'Lazzzis',
    title: 'Developer',
    links: [
      { icon: 'github', link: 'https://github.com/lazzzis' },
    ]
  }, {
    avatar: 'https://www.github.com/luoingly.png',
    name: 'Luoingly',
    title: 'Developer',
    links: [
      { icon: 'github', link: 'https://github.com/luoingly' },
    ]
  }, {
    avatar: 'https://github.com/Kerminate.png',
    name: 'Kerminate',
    title: 'Frontend Developer',
    links: [
      { icon: 'github', link: 'https://github.com/Kerminate' },
    ]
  },
]
</script>

# 开发团队 {#team}

Putong OJ 的开发与维护离不开以下团队成员的辛勤付出：

<VPTeamMembers size="small" :members />

Putong OJ 作为一个开源项目，我们欢迎任何大小的贡献和建议。如果你有兴趣参与开发或提出建议，请访问我们的 [GitHub 仓库](https://github.com/acm309/PutongOJ)。
