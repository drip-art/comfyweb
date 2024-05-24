import Widgets20240523 from './widgets-2024-05-23.json';
export type WidgetsSchema = typeof Widgets20240523;
export type Widget = WidgetsSchema[keyof WidgetsSchema];
