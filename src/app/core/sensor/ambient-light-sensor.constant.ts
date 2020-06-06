export const SENSOR_NAME = "AmbientLightSensor";
export const SENSOR_POLICY_NAME = "ambient-light-sensor";
export const ACCESS_DENIED = "denied";

export const ERROR_TYPES = {
  SECURITY: "SecurityError",
  REFERENCE: "ReferenceError",
  NOT_ALLOWED: "NotAllowedError",
  NOT_READABLE: "NotReadableError"
};

export const ERROR_MESSAGES = {
  UNSUPPORTED_SENSOR: "The browser doesn't support the ambient light sensor.",
  NOT_ALLOWED_BY_SECURITY:
    "The browser security prevented accessing the ambient light sensor.",
  NOT_SUPPORTED_BY_USER_AGENT: "The user agent does not support the ambient light sensor.",
  PREMISSION_DENIED: "The permission to use the ambient light sensor was denied.",
  CANNOT_CONNECT: "Could not connect to the ambient light sensor."
};

export const SENSOR_AMBIENT_ILLUMINANCE_DARK_ENOUGH: number = 20;
export const SENSOR_AMBIENT_ILLUMINANCE_BRIGHT_ENOUGH: number = 30;

export const SENSOR_OBSERVE_DELAY: number = 1000;
