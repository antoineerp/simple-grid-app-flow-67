
// Exporter tous les composants pour une importation plus facile

// Composants d'authentification
export { default as Logo } from './auth/Logo';
export { default as LoginForm } from './auth/LoginForm';
export { default as UsernameField } from './auth/UsernameField';
export { default as PasswordField } from './auth/PasswordField';
export { default as ForgotPasswordLink } from './auth/ForgotPasswordLink';

// Composants de diagnostic
export { default as ApiDiagnostic } from './diagnostic/ApiDiagnostic';
export { default as PhpExecutionTest } from './diagnostic/PhpExecutionTest';
export { default as ServerTest } from './ServerTest';

// Composants de mise en page
export { default as Header } from './Header';
export { default as Footer } from './Footer';
export { default as Sidebar } from './Sidebar';
export { default as Layout } from './Layout';

// Autres composants
export { default as DbConnectionTest } from './DbConnectionTest';
export { default as LogoSelector } from './LogoSelector';
export { default as ResponsableSelector } from './ResponsableSelector';
