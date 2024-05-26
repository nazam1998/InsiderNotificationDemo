import {
  ConfigPlugin,
  withAppDelegate,
  withDangerousMod,
  withInfoPlist,
  withXcodeProject,
} from "@expo/config-plugins";
import {mergeContents} from "@expo/config-plugins/build/utils/generateCode";
import fs from "fs";

const IPHONEOS_DEPLOYMENT_TARGET = "13.0";
const TARGETED_DEVICE_FAMILY = `"1,2"`;

const NSE_TARGET_NAME = "InsiderNotificationService";
const NSE_SOURCE_FILE = "NotificationService.m";
const NSE_EXT_FILES = [
  "NotificationService.h",
  `${NSE_TARGET_NAME}.entitlements`,
  `${NSE_TARGET_NAME}-Info.plist`,
];

const NCE_TARGET_NAME = "InsiderNotificationContent";
const NCE_SOURCE_FILE = "NotificationViewController.m";
const NCE_EXT_FILES = [
  "NotificationViewController.h",
  `${NCE_TARGET_NAME}-Info.plist`,
  `Base.lproj/MainInterface.storyboard`,
];

export const withUseInsiderIOS: ConfigPlugin<{
  appleIdentifier: string;
  partnerName: string;
}> = (config, {partnerName, appleIdentifier}) => {
  config = withXcodeProject(config, (newConfig) => {
    const xcodeProject = newConfig.modResults;

    const extGroup = xcodeProject.addPbxGroup(
      [...NSE_EXT_FILES, NSE_SOURCE_FILE],
      NSE_TARGET_NAME,
      NSE_TARGET_NAME,
    );

    const extContentGroup = xcodeProject.addPbxGroup(
      [...NCE_EXT_FILES, NCE_SOURCE_FILE],
      NCE_TARGET_NAME,
      NCE_TARGET_NAME,
    );
    const groups = xcodeProject.hash.project.objects["PBXGroup"];
    Object.keys(groups).forEach(function (key) {
      if (groups[key].name === undefined && groups[key].path === undefined) {
        xcodeProject.addToPbxGroup(extGroup.uuid, key);
        xcodeProject.addToPbxGroup(extContentGroup.uuid, key);
      }
    });

    const projObjects = xcodeProject.hash.project.objects;
    projObjects["PBXTargetDependency"] =
      projObjects["PBXTargetDependency"] || {};
    projObjects["PBXContainerItemProxy"] =
      projObjects["PBXTargetDependency"] || {};

    if (!!xcodeProject.pbxTargetByName(NSE_TARGET_NAME)) {
      return newConfig;
    }

    const nseTarget = xcodeProject.addTarget(
      NSE_TARGET_NAME,
      "app_extension",
      NSE_TARGET_NAME,
      `${config.ios?.bundleIdentifier}.${NSE_TARGET_NAME}`,
    );

    const nceTarget = xcodeProject.addTarget(
      NCE_TARGET_NAME,
      "app_extension",
      NCE_TARGET_NAME,
      `${config.ios?.bundleIdentifier}.${NCE_TARGET_NAME}`,
    );

    xcodeProject.addBuildPhase(
      ["NotificationService.m"],
      "PBXSourcesBuildPhase",
      "Sources",
      nseTarget.uuid,
    );
    xcodeProject.addBuildPhase(
      [],
      "PBXResourcesBuildPhase",
      "Resources",
      nseTarget.uuid,
    );

    xcodeProject.addBuildPhase(
      [],
      "PBXFrameworksBuildPhase",
      "Frameworks",
      nseTarget.uuid,
    );

    xcodeProject.addBuildPhase(
      ["NotificationViewController.m"],
      "PBXSourcesBuildPhase",
      "Sources",
      nceTarget.uuid,
    );
    xcodeProject.addBuildPhase(
      ["Base.lproj/MainInterface.storyboard"],
      "PBXResourcesBuildPhase",
      "Resources",
      nceTarget.uuid,
    );
    xcodeProject.addFramework(
      "UserNotifications.framework",
      {weak: true},
      nceTarget.uuid,
    );
    xcodeProject.addFramework(
      "UserNotificationsUI.framework",
      {weak: true},
      nceTarget.uuid,
    );

    xcodeProject.addBuildPhase(
      ["UserNotifications.framework", "UserNotificationsUI.framework"],
      "PBXFrameworksBuildPhase",
      "Frameworks",
      nceTarget.uuid,
    );
    xcodeProject.addBuildPhase(
      ["UserNotifications.framework"],
      "PBXFrameworksBuildPhase",
      "Frameworks",
      // project target id
      xcodeProject.getFirstTarget().uuid,
    );

    const configurations = xcodeProject.pbxXCBuildConfigurationSection();
    for (const key in configurations) {
      if (typeof configurations[key].buildSettings === "undefined") continue;
      if (
        configurations[key].buildSettings.PRODUCT_NAME == `"${NSE_TARGET_NAME}"`
      ) {
        const buildSettingsObj = configurations[key].buildSettings;
        buildSettingsObj.DEVELOPMENT_TEAM = "3C8L4YL3S8";
        buildSettingsObj.IPHONEOS_DEPLOYMENT_TARGET =
          IPHONEOS_DEPLOYMENT_TARGET;
        buildSettingsObj.TARGETED_DEVICE_FAMILY = TARGETED_DEVICE_FAMILY;
        buildSettingsObj.CODE_SIGN_ENTITLEMENTS = `${NSE_TARGET_NAME}/${NSE_TARGET_NAME}.entitlements`;
        buildSettingsObj.CODE_SIGN_STYLE = "Automatic";
      } else if (
        configurations[key].buildSettings.PRODUCT_NAME == `"${NCE_TARGET_NAME}"`
      ) {
        const buildSettingsObj = configurations[key].buildSettings;
        buildSettingsObj.DEVELOPMENT_TEAM = "3C8L4YL3S8";
        buildSettingsObj.IPHONEOS_DEPLOYMENT_TARGET =
          IPHONEOS_DEPLOYMENT_TARGET;
        buildSettingsObj.TARGETED_DEVICE_FAMILY = TARGETED_DEVICE_FAMILY;
        buildSettingsObj.CODE_SIGN_ENTITLEMENTS = `${NCE_TARGET_NAME}/${NCE_TARGET_NAME}.entitlements`;
        buildSettingsObj.CODE_SIGN_STYLE = "Automatic";
      }
    }

    xcodeProject.addTargetAttribute("DevelopmentTeam", "3C8L4YL3S8", nseTarget);
    xcodeProject.addTargetAttribute("DevelopmentTeam", "3C8L4YL3S8", nceTarget);
    xcodeProject.addTargetAttribute("DevelopmentTeam", "3C8L4YL3S8");
    return newConfig;
  });

  config = withDangerousMod(config, [
    "ios",
    async (config) => {
      const projectRootAsset =
        config.modRequest.projectRoot + "/plugins/assets";
      const notificationServiceFolder =
        config.modRequest.platformProjectRoot + "/InsiderNotificationService";

      if (!fs.existsSync(notificationServiceFolder))
        await fs.promises.mkdir(notificationServiceFolder);

      await fs.promises.copyFile(
        projectRootAsset + `/${NSE_TARGET_NAME}/${NSE_TARGET_NAME}-Info.plist`,
        notificationServiceFolder + `/${NSE_TARGET_NAME}-Info.plist`,
      );

      await fs.promises.copyFile(
        projectRootAsset +
          "/InsiderNotificationService/InsiderNotificationService.entitlements",
        notificationServiceFolder + "/InsiderNotificationService.entitlements",
      );

      await fs.promises.copyFile(
        projectRootAsset + "/InsiderNotificationService/NotificationService.h",
        notificationServiceFolder + "/NotificationService.h",
      );

      await fs.promises.copyFile(
        projectRootAsset + "/InsiderNotificationService/NotificationService.m",
        notificationServiceFolder + "/NotificationService.m",
      );

      return config;
    },
  ]);

  config = withDangerousMod(config, [
    "ios",
    async (config) => {
      const projectRootAsset =
        config.modRequest.projectRoot + "/plugins/assets";
      const notificationContentFolder =
        config.modRequest.platformProjectRoot + "/InsiderNotificationContent";

      if (!fs.existsSync(notificationContentFolder))
        await fs.promises.mkdir(notificationContentFolder);

      await fs.promises.copyFile(
        projectRootAsset +
          "/InsiderNotificationContent/InsiderNotificationContent-Info.plist",
        notificationContentFolder + `/${NCE_TARGET_NAME}-Info.plist`,
      );

      await fs.promises.copyFile(
        projectRootAsset +
          "/InsiderNotificationContent/InsiderNotificationContent.entitlements",
        notificationContentFolder + "/InsiderNotificationContent.entitlements",
      );

      await fs.promises.copyFile(
        projectRootAsset +
          "/InsiderNotificationContent/NotificationViewController.h",
        notificationContentFolder + "/NotificationViewController.h",
      );

      await fs.promises.copyFile(
        projectRootAsset +
          "/InsiderNotificationContent/NotificationViewController.m",
        notificationContentFolder + "/NotificationViewController.m",
      );

      if (!fs.existsSync(notificationContentFolder + "/Base.lproj")) {
        await fs.promises.mkdir(notificationContentFolder + "/Base.lproj");
      }

      await fs.promises.copyFile(
        projectRootAsset +
          "/InsiderNotificationContent/MainInterface.storyboard",
        notificationContentFolder + "/Base.lproj/MainInterface.storyboard",
      );

      return config;
    },
  ]);

  config = withInfoPlist(config, async (config) => {
    const file = config.modResults;

    file.CFBundleURLTypes?.push({
      // @ts-ignore
      CFBundleTypeRole: "Editor",
      CFBundleURLName: "insider",
      CFBundleURLSchemes: [`insider${partnerName}`],
    });
    return config;
  });
  config = withAppDelegate(config, (config) => {
    const appDelegate = config.modResults.contents;

    const lineToAdd =
      "UNUserNotificationCenter.currentNotificationCenter.delegate = self;";
    const lineToReplace =
      "return [super application:application didFinishLaunchingWithOptions:launchOptions];";

    if (appDelegate.includes(lineToReplace)) {
      const newAppDelegate = appDelegate.replace(
        lineToReplace,
        `${lineToAdd}\n${lineToReplace}`,
      );

      config.modResults.contents = newAppDelegate;
    }

    return config;
  });

  config = withDangerousMod(config, [
    "ios",
    async (config) => {
      const appDelegatePath = `${config.modRequest.platformProjectRoot}/${config.modRequest.projectName}/AppDelegate.h`;
      const appDelegate = fs.readFileSync(appDelegatePath, "utf8");
      const lineToAdd = `#import <UserNotifications/UserNotifications.h>\n@interface AppDelegate : EXAppDelegateWrapper <UNUserNotificationCenterDelegate>`;
      const lineToReplace = `@interface AppDelegate : EXAppDelegateWrapper`;
      if (appDelegate.includes(lineToReplace)) {
        const newAppDelegate = appDelegate.replace(lineToReplace, lineToAdd);

        fs.writeFileSync(appDelegatePath, newAppDelegate);
      }
      return config;
    },
  ]);

  config = withDangerousMod(config, [
    "ios",
    async (config) => {
      const pathPodfile = config.modRequest.platformProjectRoot + "/podfile";
      const appTitle = config.modRequest.projectName;
      const podfile = fs.readFileSync(pathPodfile, "utf8");

      let resp = mergeContents({
        tag: `RAHADEV1`,
        src: podfile,
        newSrc: `inherit! :search_paths
          # Pods for InsiderDemo
          pod 'InsiderMobile'`,
        anchor: /use_expo_modules!/,
        offset: 0,
        comment: "#",
      }).contents;

      resp += `
      target 'InsiderNotificationContent' do
      use_frameworks!
      inherit! :search_paths
      # Pods for InsiderNotificationContent
      pod "InsiderMobileAdvancedNotification"
      end
      target 'InsiderNotificationService' do
      use_frameworks!
      inherit! :search_paths
      # Pods for InsiderNotificationService
      pod "InsiderMobileAdvancedNotification"
      end`;

      const newContent = mergeContents({
        tag: `RAHADEV2`,
        src: resp,
        newSrc: `use_frameworks! :linkage => :static`,
        anchor: `target '${appTitle}' do`,
        offset: 0,
        comment: "#",
      }).contents;

      fs.writeFileSync(pathPodfile, newContent);

      return config;
    },
  ]);
  return config;
};
