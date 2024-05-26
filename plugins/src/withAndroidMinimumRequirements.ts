/* eslint-disable no-shadow */
import {
  ConfigPlugin,
  createRunOncePlugin,
  withAndroidManifest,
} from "@expo/config-plugins";

const withAndroidMinimumRequirements: ConfigPlugin<void> = (config) => {
  config = withAndroidManifest(config, (config) => {
    // https://developer.android.com/about/versions/12/behavior-changes-12#exported
    config.modResults.manifest.application?.forEach((application) => {
      application.activity?.forEach((activity) => {
        let exported: boolean | null = null;
        if (activity.$["android:exported"]) {
          // Already set
          return;
        }
        activity["intent-filter"]?.forEach((intentFilter) => {
          intentFilter.action?.forEach((action) => {
            if (
              action.$["android:name"].includes("intent") &&
              exported === null
            ) {
              exported = false;
            }
          });
          intentFilter.category?.forEach((category) => {
            if (
              category.$["android:name"].includes("intent") &&
              exported === null
            ) {
              exported = false;
            }
            if (
              category.$["android:name"] === "android.intent.category.LAUNCHER"
            ) {
              exported = true;
            }
          });
          if (exported !== null) {
            activity.$["android:exported"] = exported.toString() as
              | "true"
              | "false";
          }
        });
      });
      return application;
    });
    return config;
  });
  return config;
};

export default createRunOncePlugin(
  withAndroidMinimumRequirements,
  "withAndroidMinimumRequirements",
  "1.0.0",
);
