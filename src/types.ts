export type BackButtonCallback = () => boolean | Promise<boolean>

export interface BackButtonHandler {
  id: string
  priority: number
  label?: string
  handler: BackButtonCallback
}

export interface BackButtonOptions {
  /**
   * Priority level for handler execution (higher number = executed first).
   * Refer to BACK_BUTTON_PRIORITY constants for canonical tiers.
   * @default 0
   */
  priority?: number

  /**
   * Optional human-readable label for debugging and logging.
   */
  label?: string
}

export interface ExitConfirmationOptions {
  /**
   * Whether double-tap back button to exit the app is enabled.
   * @default true
   */
  enabled?: boolean

  /**
   * Time window in milliseconds between the two taps to trigger exit.
   * @default 2000
   */
  windowMs?: number

  /**
   * Callback fired on the first back button press when on a root route.
   * Typically used to display a toast / snackbar notifying the user.
   */
  onFirstPress?: () => void

  /**
   * Callback fired before app exits on the second back button press.
   * Useful for flushing analytics or cleanup.
   */
  onExit?: () => Promise<void> | void
}

export interface ModuleOptions {
  /**
   * Root routes where the back button asks for exit confirmation instead of router.back().
   * @default ['/', '/home']
   */
  rootPaths?: string[]

  /**
   * Exit confirmation configuration.
   */
  exitConfirmation?: ExitConfirmationOptions

  /**
   * Whether to output debug logs to console.
   * @default false
   */
  debug?: boolean
}

