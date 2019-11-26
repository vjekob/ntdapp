import { Linking } from "expo";

export const NTDAPP_AUTH = {
    authorizeUri: "https://login.microsoftonline.com/ab174d1e-2020-46ce-9da2-d8fc6d03547f/oauth2/authorize",
    tokenUri: "https://login.microsoftonline.com/ab174d1e-2020-46ce-9da2-d8fc6d03547f/oauth2/token",
    resourceUri: "https://api.businesscentral.dynamics.com",
    clientId: "d03ccaca-a0d5-4bc2-a7ab-cdbefc915a6e",
    clientSecret: "q9QY*n56b3dZmzyqv=?C:AxJ.[]9Dz1v",
    redirectUri: Linking.makeUrl().startsWith("ntdapp://")
      ? "ntdapp://bc.redirect/"
      : "https://login.live.com/oauth20_desktop.srf"
  };
  
  