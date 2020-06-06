export const SENSOR_NAME = "AmbientLightSensor";
export const SENSOR_POLICY_NAME = "ambient-light-sensor";
export const ACCESS_DENIED = "denied";
export const THEME_OPTIONS_URL = "/assets/options.json";
export const THEME_BASE_PATH = "node_modules/@angular/material/prebuilt-themes";
export const STYLE_TO_SET = "theme";
export const DARK_THEME = "pink-bluegrey";
export const LIGHT_THEME = "deeppurple-amber";

export const ERROR_TYPES = {
  SECURITY: "SecurityError",
  REFERENCE: "ReferenceError",
  NOT_ALLOWED: "NotAllowedError",
  NOT_READABLE: "NotReadableError"
};

export const ERROR_MESSAGES = {
  UNSUPPORTED_FEATURE: "Your browser doesn't support the ambient light sensor feature",
  BLOCKED_BY_FEATURE_POLICY:
    "Sensor construction was blocked by a feature policy.",
  NOT_SUPPORTED_BY_USER_AGENT: "Sensor is not supported by the User-Agent.",
  PREMISSION_DENIED: "Permission to use the ambient light sensor is denied.",
  CANNOT_CONNECT: "Cannot connect to the sensor."
};

export const SENSOR_AMBIENT_ILLUMINANCE_DARK_ENOUGH: number = 20;
export const SENSOR_AMBIENT_ILLUMINANCE_BRIGHT_ENOUGH: number = 30;
