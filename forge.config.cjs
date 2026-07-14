const { FusesPlugin } = require("@electron-forge/plugin-fuses");
const { FuseV1Options, FuseVersion } = require("@electron/fuses");

const commonLinuxConfig = {
  categories: ["Audio converter", "Utility"],
  // icon: {
  //   "1024x1024": path.resolve(iconDir, "fiddle.png"),
  //   scalable: path.resolve(iconDir, "fiddle.svg"),
  // },
  // mimeType: ["x-scheme-handler/electron-fiddle"],
};

module.exports = {
  packagerConfig: {
    name: "RBTC Audio Converter",
    executableName: "rbtc-audio-converter",
    asar: true,
    win32metadata: {
      CompanyName: "DK Technologies",
      OriginalFilename: "RBTC Audio Converter",
    },
  },
  rebuildConfig: {},
  makers: [
    {
      name: "@electron-forge/maker-squirrel",
      platforms: ["win32"],
      config: () => ({
        name: "rbtc-audio-converter",
        authors: "DK Technologies",
        exe: "rbtc-audio-converter.exe",
        // iconUrl:
        //   "https://raw.githubusercontent.com/darikletter/rbtc-audio-converter/master/assets/icons/rbtc-audio-converter.ico",
        // loadingGif: "./assets/loading.gif",
        // noMsi: true,
        // setupExe: `rbtc-audio-converter-${version}-win32-${arch}-setup.exe`,
        // setupIcon: path.resolve(iconDir, "rbtc-audio-converter.ico"),
        // signWithParams: process.env.CERT_FINGERPRINT
        //   ? `/sha1 ${process.env.CERT_FINGERPRINT} /tr http://timestamp.digicert.com /td SHA256 /fd SHA256`
        //   : undefined,
      }),
    },
    {
      name: "@electron-forge/maker-zip",
      platforms: ["darwin"],
    },
    {
      name: "@electron-forge/maker-deb",
      platforms: ["linux"],
      config: commonLinuxConfig,
    },
    {
      name: "@electron-forge/maker-rpm",
      platforms: ["linux"],
      config: commonLinuxConfig,
    },
  ],
  publishers: [
    {
      name: "@electron-forge/publisher-github",
      config: {
        repository: {
          owner: "daribock",
          name: "rbtc-audio-converter",
        },
        prerelease: false,
        draft: true,
      },
    },
  ],
  plugins: [
    {
      name: "@electron-forge/plugin-auto-unpack-natives",
      config: {},
    },
    // Fuses are used to enable/disable various Electron functionality
    // at package time, before code signing the application
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
};
