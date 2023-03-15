module.exports = {
  packagerConfig: {
    icon: "files/icon.ico",
    ignore: "(tests*|.github*)",
    arch: ['x64', 'arm64'],
  },
  electronPackagerConfig: {
    packageName: "jsontranstool",
    name: "jsontranstool",
    productName: "jsontranstool",
    CompanyName: "busybox11"
  },
  makers: [
    {
      name: "@electron-forge/maker-squirrel",
      config: {
        name: "autodoms",
        exe: "jsontranstool.exe",
        setupExe: "jsontranstool.setup.exe"
      }
    },
    {
      name: "@electron-forge/maker-zip",
      platforms: [
        "darwin"
      ]
    },
    {
      name: "@electron-forge/maker-deb",
      config: {}
    }
  ],
  publishers: [
    {
      name: "@electron-forge/publisher-github",
      platforms: [
        "win32"
      ],
      config: {
        repository: {
          owner: "busybox11",
          name: "jsontranstool"
        }
      }
    }
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-webpack',
      config: {
        devContentSecurityPolicy: `default-src * self blob: data: gap:; style-src * self 'unsafe-inline' blob: data: gap:; script-src * 'self' 'unsafe-eval' 'unsafe-inline' blob: data: gap:; object-src * 'self' blob: data: gap:; img-src * self 'unsafe-inline' blob: data: gap:; connect-src self * 'unsafe-inline' blob: data: gap:; frame-src * self blob: data: gap:;`,
        mainConfig: './webpack.main.config.js',
        renderer: {
          config: './webpack.renderer.config.js',
          entryPoints: [
            {
              html: './src/index.html',
              js: './src/renderer.js',
              name: 'main_window',
              preload: {
                js: './src/preload.js',
              },
            },
          ],
        },
      },
    },
  ],
};
