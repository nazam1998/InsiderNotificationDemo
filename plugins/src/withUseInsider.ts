import {ConfigPlugin, createRunOncePlugin} from "@expo/config-plugins";
import {withUseInsiderAndroid} from "./withUseInsiderAndroid";
import {withUseInsiderIOS} from "./withUseInsiderIOS";
const pkg = require("../../package.json");

const withUseInsider: ConfigPlugin<{
  partnerName?: string;
  googleAdsId?: string;
  appleIdentifier: string;
}> = (config, {partnerName, googleAdsId, appleIdentifier}) => {
  if (!partnerName)
    throw new Error("You must provide a partnerName to use the insider plugin");


  config = withUseInsiderAndroid(config, {
    partnerName,
    googleAdsId,
  });
  config = withUseInsiderIOS(config, {partnerName, appleIdentifier});
  return config;
};

export default createRunOncePlugin(
  withUseInsider,
  "insider plugin",
  pkg.version,
);
