import { Widgets20240524 } from './widgets-2024-05-24'
export type WidgetsSchema = typeof Widgets20240524
export type Widget = WidgetsSchema[keyof WidgetsSchema]
