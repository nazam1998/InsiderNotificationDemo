import {
  ConfigPlugin,
  withAndroidManifest,
  withAppBuildGradle,
  withDangerousMod,
  withProjectBuildGradle,
} from "@expo/config-plugins";
import { mergeContents } from "@expo/config-plugins/build/utils/generateCode";

import fs from "fs";

interface IProps {
  partnerName: string;
  googleAdsId: string | undefined;
}

export const withUseInsiderAndroid: ConfigPlugin<IProps> = (
  config,
  { partnerName, googleAdsId }
) => {
  config = withProjectBuildGradle(config, (config) => {
    // adding maven { url "https://developer.huawei.com/repo/"} inside buildscript --> repositories

    let updatedContent = mergeContents({
      tag: "INSIDER-ProjectBuildGradle-inside_buildscript_repositories",
      src: config.modResults.contents,
      newSrc: '        maven { url "https://developer.huawei.com/repo/"}',
      anchor: "mavenCentral()",
      offset: 1,
      comment: "//",
    }).contents;

    // adding inside buildscript --> dependencies
    // classpath 'com.google.gms:google-services:4.3.3' // Already present
    // classpath 'com.huawei.agconnect:agcp:1.2.1.301'
    const searchString = `classpath('com.android.tools.build:gradle')`;
    const newString = `classpath('com.android.tools.build:gradle')
        classpath('com.huawei.agconnect:agcp:1.2.1.301')
        classpath('com.google.gms:google-services:4.3.3')`;

    updatedContent = updatedContent.replace(searchString, newString);

    // adding inside allproject-->repositories

    updatedContent = mergeContents({
      tag: "INSIDER-inside_allprojects_repositories",
      src: updatedContent,
      newSrc: `maven {url "https://mobilesdk.useinsider.com/android"}
      maven {url "https://developer.huawei.com/repo/"}`,
      anchor: "maven { url 'https://www.jitpack.io' }",
      offset: 1,
      comment: "//",
    }).contents;

    config.modResults.contents = updatedContent;

    return config;
  });

  config = withAppBuildGradle(config, (config) => {
    // inserting inside android --> defaultConfig
    const contents = config.modResults.contents;

    const updatedContent = mergeContents({
      tag: "INSIDER-inside_android_defaultConfig",
      src: contents,
      newSrc: `        manifestPlaceholders = [partner:"${partnerName}"]`,
      anchor: "applicationId",
      offset: 1,
      comment: "//",
    }).contents;

    config.modResults.contents = updatedContent;

    return config;
  });

  config = withAndroidManifest(config, (config) => {
    //inserting google ads id inside AndroidManifest.xml

    // shape of insertion
    // <meta-data
    //   android:name='com.google.android.gms.ads.APPLICATION_ID'
    //   android:value='ca-app-pub-xxxxxxxxxxxxxxxx~yyyyyyyyyy'
    // />;

    const metaData = config.modResults.manifest.application?.[0]?.["meta-data"];
    if (!metaData)
      throw new Error(
        "meta-data tag not found in AndroidManifest.xml (INSIDER PLUGIN)"
      );
    if (googleAdsId) {
      metaData.push({
        $: {
          "android:name": `com.google.android.gms.ads.APPLICATION_ID`,
          "android:value": googleAdsId,
        },
      });
    }

    //removing android:allowBackup="true""
    const application = config.modResults.manifest.application?.[0];
    if (!application)
      throw new Error(
        "application tag not found in AndroidManifest.xml (INSIDER PLUGIN)"
      );
    delete application.$["android:allowBackup"];

    return config;
  });

  // modifying proguard-rules.pro
  config = withDangerousMod(config, [
    "android",
    (config) => {
      const proGuardRulesFilePath = `${config.modRequest.platformProjectRoot}/app/proguard-rules.pro`;

      const content = `-keep class com.useinsider.insider.Insider { *; }
-keep interface com.useinsider.insider.InsiderCallback { *; }
-keep class com.useinsider.insider.InsiderUser { *; }
-keep class com.useinsider.insider.InsiderProduct { *; }
-keep class com.useinsider.insider.InsiderEvent { *; }
-keep class com.useinsider.insider.InsiderCallbackType { *; }
-keep class com.useinsider.insider.InsiderGender { *; }
-keep class com.useinsider.insider.InsiderIdentifiers { *; }
-keep interface com.useinsider.insider.RecommendationEngine$SmartRecommendation { *; }
-keep interface com.useinsider.insider.MessageCenterData { *; }
-keep class com.useinsider.insider.Geofence { *; }
-keep class com.useinsider.insider.ContentOptimizerDataType { *; }
-keep class org.openudid.** { *; }
-keep class com.useinsider.insider.OpenUDID_manager { *; }`;

      const file = fs.readFileSync(proGuardRulesFilePath).toString();

      const updatedContent = mergeContents({
        tag: "INSIDER",
        src: file,
        newSrc: content,
        anchor: /options here/,
        offset: 1,
        comment: "#",
      }).contents;

      fs.writeFileSync(proGuardRulesFilePath, updatedContent);

      return config;
    },
  ]);
  return config;
};
