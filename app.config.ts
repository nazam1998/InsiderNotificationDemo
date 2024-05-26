const partnerName = "shopraha";
const appleIdentifier = "com.shopraha";

const expoConfig = {
  expo: {
    name: "RAHA",
    slug: "shop-raha-app",
    version: "1.0.0",
    owner: "shopraha",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    userInterfaceStyle: "light",
    jsEngine: "hermes",
    splash: {
      image: "./assets/images/splash.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff",
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.shopraha",
      googleServicesFile: "./GoogleService-Info.plist",
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#ffffff",
      },
      googleServicesFile: "./google-services.json",

      package: "com.shopraha.android",
    },
    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/images/favicon.png",
    },
    plugins: [
      "expo-router",
      "@react-native-firebase/app",
      "@react-native-firebase/messaging",
      [
        "expo-build-properties",
        {
          android: {
            minSdkVersion: 24,
            compileSdkVersion: 34,
            targetSdkVersion: 34,
            buildToolsVersion: "34.0.0",
          },
          ios: {
            deploymentTarget: "13.4",
            useFrameworks: "static",
          },
        },
      ],
      [
        "./plugins/build/withUseInsider",
        {
          partnerName,
          appleIdentifier,
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      router: {
        origin: false,
      },
      eas: {
        projectId: "902ad235-26e4-4902-b963-ad48307f1ef8",
      },
    },
  },
};
export default expoConfig;
