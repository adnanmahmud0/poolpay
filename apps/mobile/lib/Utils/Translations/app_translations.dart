import 'package:get/get.dart';

class AppTranslations extends Translations {
  @override
  Map<String, Map<String, String>> get keys => {
        'en': _en,
        'en_US': _en,
        'es': _es,
        'es_ES': _es,
        'fr': _fr,
        'fr_FR': _fr,
        'ht': _ht,
        'ht_HT': _ht,
      };

  static final Map<String, String> _en = {
      // Common
      'select_language': 'Select Your Language',
      'continue': 'Continue',
      'save': 'Save',
      'search': 'Search',
      'back': 'Back',
      'next': 'Next',
      'skip': 'Skip for now',
      'version': 'Version',
      'active': 'Active',
      'pending': 'Pending',
      'completed': 'Completed',
      'failed': 'Failed',
      'all': 'All',
      'see_all': 'See All',

      // Navigation
      'nav_home': 'Home',
      'nav_groups': 'Groups',
      'nav_payments': 'Payments',
      'nav_alerts': 'Alerts',
      'nav_profile': 'Profile',

      // Auth - Login
      'login_title': 'Emergency Savings Circle',
      'login_subtitle': 'Start your emergency savings with family and friends',
      'email_phone': 'Email or phone number',
      'password': 'Password',
      'forgot_password': 'Forgot Password?',
      'login_button': 'Log In',
      'no_account': 'Don\'t have an account? ',
      'signup_link': 'Sign Up',
      'or_continue': 'OR CONTINUE WITH',

      // Auth - Sign Up
      'signup_title': 'Sign Up For Savings',
      'signup_subtitle': 'Start saving with your friends and family.',
      'full_name': 'Full Name',
      'first_name': 'First Name',
      'last_name': 'Last Name',
      'phone_number': 'Phone Number',
      'password_hint': '8+ chars, alphanumeric & special',
      'confirm_password': 'Confirm New Password',
      'agree_terms': 'I agree to the ',
      'terms_conditions': 'Terms and Conditions\n',
      'and': 'and ',
      'privacy_policy': 'Privacy Policy',
      'already_account': 'Already have an account? ',

      // Auth - Forgot Password
      'reset_password': 'Reset Password',
      'reset_subtitle': 'Enter your email address for reset password',
      'email_address': 'Email Address',
      'send_reset_link': 'Send Reset Link',
      'back_login': 'Back to Login',

      // Auth - OTP
      'otp_title': 'OTP',
      'otp_subtitle': 'Enter your OTP for reset password',
      'confirm_otp': 'Confirm OTP',
      'back_email': 'Back to Email',

      // Auth - Set Password
      'set_password_title': 'Set Password for Savings',
      'new_password': 'New Password',

      // Auth - Complete Profile
      'complete_profile_title': 'Complete your profile',
      'complete_profile_subtitle': 'Help us know you better',
      'upload_picture': 'Upload profile picture',
      'dob': 'Date of Birth',
      'occupation': 'Occupation',
      'occupation_hint': 'Enter your occupation',
      'address': 'Street address',
      'address_hint': 'Enter your address',
      'city': 'City',
      'state': 'State',
      'zip_code': 'ZIP Code',

      // Auth - Payment Method Link
      'link_payment_title': 'Link your payment method',
      'link_payment_subtitle':
          'Add a bank account or card for\nautomatic contributions',
      'bank_account': 'Bank Account',
      'credit_card': 'Credit Card',
      'link_bank': 'Link Bank Account',
      'add_card': 'Add Debit/Credit Card',
      'security_note':
          'Your banking information is encrypted and secure. We use bank-level security to protect your data.',

      // Home
      'welcome_back': 'Welcome back,',
      'total_saved': 'Total Saved',
      'active_groups': 'Active Groups',
      'quick_actions': 'Quick Actions',
      'create_group': 'Create Group',
      'join_group': 'Join Group',
      'my_groups': 'My Groups',
      'no_groups_joined': 'You haven\'t joined any groups yet',
      'create_first_group': 'Create Your First Group',
      'monthly': 'monthly',
      'members': 'members',
      'position': 'Position',

      // Groups
      'basic_info': 'Basic Information',
      'group_name': 'Group Name',
      'group_name_hint': 'e.g., Family Savings Circle',
      'description': 'Description',
      'description_hint': 'Describe the purpose of this group...',
      'contribution_settings': 'Contribution Settings',
      'review_details': 'Review Details',
      'enter_invite_code': 'Enter Invite Code',
      'invite_code_subtitle':
          'Ask the group admin for the invite code to join their savings group',
      'enter_code_hint': 'ENTER CODE',
      'demo_codes': 'Try these demo codes:',

      // Payment
      'payments': 'Payments',
      'payment_methods': 'Payment Methods',
      'add_new': '+ Add New',
      'recent_payments': 'Recent Payments',
      'this_month': 'This Month',
      'auto_payments_enabled': 'Automatic Payments Enabled',
      'auto_payments_desc':
          'Your contributions are automatically deducted based on your group\'s schedule. You\'ll receive a notification before each payment.',
      'payment_history': 'Payment History',
      'total_contributed': 'Total Contributed',
      'total_payout_received': 'Total Payout Received',
      'payouts': 'payouts',
      'no_payments_found': 'No payments found',
      'no_payouts_found': 'No payouts found',

      // Profile
      'email': 'Email',
      'phone': 'Phone',
      'linked': 'linked',
      'security_settings': 'Security & Settings',
      'two_factor': 'Two-Factor Authentication',
      'enabled': 'Enabled',
      'disabled': 'Disabled',
      'language': 'Language',
      'support': 'Support',
      'help_center': 'Help Center',
      'terms_privacy': 'Terms & Privacy',
      'logout': 'Logout',
      'delete_account': 'Delete Account',
      'delete_account_subtitle': 'Request permanent closure & data erasure',
      'delete_account_info': 'How Account Deletion Works',
      'delete_step_1_title': 'Identity Verification',
      'delete_step_1_desc': 'Enter your password to verify account ownership.',
      'delete_step_2_title': 'Obligations Check',
      'delete_step_2_desc': 'System checks that all active pool rounds and dues are resolved.',
      'delete_step_3_title': 'Admin Review',
      'delete_step_3_desc': 'Our compliance team reviews and processes the request within 24-48 hours.',
      'delete_step_4_title': 'Permanent Deletion',
      'delete_step_4_desc': 'Once approved, your account, cards, and personal data are permanently deleted.',
      'enter_password_confirm': 'Enter your password to confirm',
      'reason_optional': 'Reason for deletion (optional)',
      'submit_deletion_request': 'Submit Deletion Request',
      'cancel': 'Cancel',
    };

  static final Map<String, String> _es = {
      // Common
      'select_language': 'Selecciona tu idioma',
      'continue': 'Continuar',
      'save': 'Guardar',
      'search': 'Buscar',
      'back': 'Atrás',
      'next': 'Siguiente',
      'skip': 'Omitir por ahora',
      'version': 'Versión',
      'active': 'Activo',
      'pending': 'Pendiente',
      'completed': 'Completado',
      'failed': 'Fallido',
      'all': 'Todos',
      'see_all': 'Ver Todo',

      // Navigation
      'nav_home': 'Inicio',
      'nav_groups': 'Grupos',
      'nav_payments': 'Pagos',
      'nav_alerts': 'Alertas',
      'nav_profile': 'Perfil',

      // Auth - Login
      'login_title': 'Iniciar sesión para ahorrar',
      'login_subtitle': 'Empieza a ahorrar con tus amigos y familiares.',
      'email_phone': 'Correo electrónico o número de teléfono',
      'password': 'Contraseña',
      'forgot_password': '¿Olvidaste tu contraseña?',
      'login_button': 'Iniciar sesión',
      'no_account': '¿No tienes una cuenta? ',
      'signup_link': 'Regístrate',
      'or_continue': 'O CONTINÚA CON',

      // Auth - Sign Up
      'signup_title': 'Regístrate para ahorrar',
      'signup_subtitle': 'Empieza a ahorrar con tus amigos y familiares.',
      'full_name': 'Nombre completo',
      'first_name': 'Nombre',
      'last_name': 'Apellido',
      'phone_number': 'Número de teléfono',
      'confirm_password': 'Confirmar nueva contraseña',
      'agree_terms': 'Acepto los ',
      'terms_conditions': 'Términos y Condiciones\n',
      'and': 'y ',
      'privacy_policy': 'Política de Privacidad',
      'already_account': '¿Ya tienes una cuenta? ',

      // Auth - Forgot Password
      'reset_password': 'Restablecer contraseña',
      'reset_subtitle':
          'Ingresa tu correo electrónico para restablecer la contraseña',
      'email_address': 'Dirección de correo electrónico',
      'send_reset_link': 'Enviar enlace de restablecimiento',
      'back_login': 'Volver al inicio de sesión',

      // Auth - OTP
      'otp_title': 'OTP',
      'otp_subtitle': 'Ingresa tu OTP para restablecer la contraseña',
      'confirm_otp': 'Confirmar OTP',
      'back_email': 'Volver al correo',

      // Auth - Set Password
      'set_password_title': 'Establecer contraseña para ahorrar',
      'new_password': 'Nueva contraseña',

      // Auth - Complete Profile
      'complete_profile_title': 'Completa tu perfil',
      'complete_profile_subtitle': 'Ayúdanos a conocerte mejor',
      'upload_picture': 'Subir foto de perfil',
      'dob': 'Fecha de nacimiento',
      'occupation': 'Ocupación',
      'occupation_hint': 'Ingresa tu ocupación',
      'address': 'Dirección',
      'address_hint': 'Ingresa tu dirección',
      'city': 'Ciudad',
      'state': 'Estado',
      'zip_code': 'Código Postal',

      // Auth - Payment Method Link
      'link_payment_title': 'Vincula tu método de pago',
      'link_payment_subtitle':
          'Agrega una cuenta bancaria o tarjeta para\ncontribuciones automáticas',
      'bank_account': 'Cuenta Bancaria',
      'credit_card': 'Tarjeta de Crédito',
      'link_bank': 'Vincular Cuenta Bancaria',
      'add_card': 'Agregar Tarjeta de Débito/Crédito',
      'security_note':
          'Tu información bancaria está encriptada y segura. Usamos seguridad de nivel bancario para proteger tus datos.',

      // Home
      'welcome_back': 'Bienvenido de nuevo,',
      'total_saved': 'Total Ahorrado',
      'active_groups': 'Grupos Activos',
      'quick_actions': 'Acciones Rápidas',
      'create_group': 'Crear Grupo',
      'join_group': 'Unirse al Grupo',
      'my_groups': 'Mis Grupos',
      'no_groups_joined': 'Aún no te has unido a ningún grupo',
      'create_first_group': 'Crea tu primer grupo',
      'monthly': 'mensual',
      'members': 'miembros',
      'position': 'Posición',

      // Groups
      'basic_info': 'Información Básica',
      'group_name': 'Nombre del Grupo',
      'group_name_hint': 'ej., Círculo de Ahorro Familiar',
      'description': 'Descripción',
      'description_hint': 'Describe el propósito de este grupo...',
      'contribution_settings': 'Configuración de Contribución',
      'review_details': 'Revisar Detalles',
      'enter_invite_code': 'Ingresar Código de Invitación',
      'invite_code_subtitle':
          'Pide al administrador del grupo el código de invitación para unirte',
      'enter_code_hint': 'INGRESAR CÓDIGO',
      'demo_codes': 'Prueba estos códigos de demostración:',

      // Payment
      'payments': 'Pagos',
      'payment_methods': 'Métodos de Pago',
      'add_new': '+ Agregar Nuevo',
      'recent_payments': 'Pagos Recientes',
      'this_month': 'Este Mes',
      'auto_payments_enabled': 'Pagos Automáticos Habilitados',
      'auto_payments_desc':
          'Tus contribuciones se deducen automáticamente según el horario de tu grupo. Recibirás una notificación antes de cada pago.',
      'payment_history': 'Historial de Pagos',
      'total_contributed': 'Total Contribuido',
      'total_payout_received': 'Pago Total Recibido',
      'payouts': 'pagos',
      'no_payments_found': 'No se encontraron pagos',
      'no_payouts_found': 'No se encontraron pagos',

      // Profile
      'email': 'Correo',
      'phone': 'Teléfono',
      'linked': 'vinculado',
      'security_settings': 'Seguridad y Configuración',
      'two_factor': 'Autenticación de Dos Factores',
      'enabled': 'Habilitado',
      'disabled': 'Deshabilitado',
      'language': 'Idioma',
      'support': 'Soporte',
      'help_center': 'Centro de Ayuda',
      'terms_privacy': 'Términos y Privacidad',
      'logout': 'Cerrar Sesión',
      'delete_account': 'Eliminar cuenta',
      'delete_account_subtitle': 'Solicitar cierre permanente y borrado de datos',
      'delete_account_info': 'Cómo funciona la eliminación de cuenta',
      'delete_step_1_title': 'Verificación de identidad',
      'delete_step_1_desc': 'Ingresa tu contraseña para confirmar la titularidad de la cuenta.',
      'delete_step_2_title': 'Revisión de obligaciones',
      'delete_step_2_desc': 'El sistema verifica que todas las rondas activas y cuotas estén resueltas.',
      'delete_step_3_title': 'Revisión del administrador',
      'delete_step_3_desc': 'El equipo administrativo revisa y procesa la solicitud en 24-48 horas.',
      'delete_step_4_title': 'Eliminación permanente',
      'delete_step_4_desc': 'Una vez aprobada, tu cuenta, tarjetas y datos personales se eliminan permanentemente.',
      'enter_password_confirm': 'Ingresa tu contraseña para confirmar',
      'reason_optional': 'Motivo de eliminación (opcional)',
      'submit_deletion_request': 'Enviar solicitud de eliminación',
      'cancel': 'Cancelar',
    };

  static final Map<String, String> _fr = {
      // Common
      'select_language': 'Sélectionnez votre langue',
      'continue': 'Continuer',
      'save': 'Enregistrer',
      'search': 'Rechercher',
      'back': 'Retour',
      'next': 'Suivant',
      'skip': 'Passer pour l\'instant',
      'version': 'Version',
      'active': 'Actif',
      'pending': 'En attente',
      'completed': 'Terminé',
      'failed': 'Échoué',
      'all': 'Tout',
      'see_all': 'Voir Tout',

      // Navigation
      'nav_home': 'Accueil',
      'nav_groups': 'Groupes',
      'nav_payments': 'Paiements',
      'nav_alerts': 'Alertes',
      'nav_profile': 'Profil',

      // Auth - Login
      'login_title': 'Connectez-vous pour économiser',
      'login_subtitle':
          'Commencez à économiser avec vos amis et votre famille.',
      'email_phone': 'E-mail ou numéro de téléphone',
      'password': 'Mot de passe',
      'forgot_password': 'Mot de passe oublié ?',
      'login_button': 'Se connecter',
      'no_account': 'Vous n\'avez pas de compte ? ',
      'signup_link': 'S\'inscrire',
      'or_continue': 'OU CONTINUER AVEC',

      // Auth - Sign Up
      'signup_title': 'Inscrivez-vous pour économiser',
      'signup_subtitle':
          'Commencez à économiser avec vos amis et votre famille.',
      'full_name': 'Nom complet',
      'first_name': 'Prénom',
      'last_name': 'Nom',
      'phone_number': 'Numéro de téléphone',
      'confirm_password': 'Confirmer le nouveau mot de passe',
      'agree_terms': 'J\'accepte les ',
      'terms_conditions': 'Termes et Conditions\n',
      'and': 'et ',
      'privacy_policy': 'Politique de Confidentialité',
      'already_account': 'Vous avez déjà un compte ? ',

      // Auth - Forgot Password
      'reset_password': 'Réinitialiser le mot de passe',
      'reset_subtitle':
          'Entrez votre adresse e-mail pour réinitialiser le mot de passe',
      'email_address': 'Adresse e-mail',
      'send_reset_link': 'Envoyer le lien de réinitialisation',
      'back_login': 'Retour à la connexion',

      // Auth - OTP
      'otp_title': 'OTP',
      'otp_subtitle': 'Entrez votre OTP pour réinitialiser le mot de passe',
      'confirm_otp': 'Confirmer OTP',
      'back_email': 'Retour à l\'e-mail',

      // Auth - Set Password
      'set_password_title': 'Définir le mot de passe pour économiser',
      'new_password': 'Nouveau mot de passe',

      // Auth - Complete Profile
      'complete_profile_title': 'Complétez votre profil',
      'complete_profile_subtitle': 'Aidez-nous à mieux vous connaître',
      'upload_picture': 'Télécharger une photo de profil',
      'dob': 'Date de naissance',
      'occupation': 'Profession',
      'occupation_hint': 'Entrez votre profession',
      'address': 'Adresse',
      'address_hint': 'Entrez votre adresse',
      'city': 'Ville',
      'state': 'État',
      'zip_code': 'Code Postal',

      // Auth - Payment Method Link
      'link_payment_title': 'Liez votre méthode de paiement',
      'link_payment_subtitle':
          'Ajoutez un compte bancaire ou une carte pour\ndes contributions automatiques',
      'bank_account': 'Compte Bancaire',
      'credit_card': 'Carte de Crédit',
      'link_bank': 'Lier un Compte Bancaire',
      'add_card': 'Ajouter une Carte de Débit/Crédit',
      'security_note':
          'Vos informations bancaires sont cryptées et sécurisées. Nous utilisons une sécurité de niveau bancaire pour protéger vos données.',

      // Home
      'welcome_back': 'Bienvenue,',
      'total_saved': 'Total Économisé',
      'active_groups': 'Groupes Actifs',
      'quick_actions': 'Actions Rapides',
      'create_group': 'Créer un Groupe',
      'join_group': 'Rejoindre un Groupe',
      'my_groups': 'Mes Groupes',
      'no_groups_joined': 'Vous n\'avez encore rejoint aucun groupe',
      'create_first_group': 'Créez votre premier groupe',
      'monthly': 'mensuel',
      'members': 'membres',
      'position': 'Position',

      // Groups
      'basic_info': 'Informations de Base',
      'group_name': 'Nom du Groupe',
      'group_name_hint': 'ex., Cercle d\'Épargne Familial',
      'description': 'Description',
      'description_hint': 'Décrivez le but de ce groupe...',
      'contribution_settings': 'Paramètres de Contribution',
      'review_details': 'Vérifier les Détails',
      'enter_invite_code': 'Entrer le Code d\'Invitation',
      'invite_code_subtitle':
          'Demandez le code d\'invitation à l\'administrateur du groupe pour rejoindre',
      'enter_code_hint': 'ENTRER LE CODE',
      'demo_codes': 'Essayez ces codes de démonstration :',

      // Payment
      'payments': 'Paiements',
      'payment_methods': 'Méthodes de Paiement',
      'add_new': '+ Ajouter Nouveau',
      'recent_payments': 'Paiements Récents',
      'this_month': 'Ce Mois-ci',
      'auto_payments_enabled': 'Paiements Automatiques Activés',
      'auto_payments_desc':
          'Vos contributions sont déduites automatiquement selon le calendrier de votre groupe. Vous recevrez une notification avant chaque paiement.',
      'payment_history': 'Historique des Paiements',
      'total_contributed': 'Total Contribué',
      'total_payout_received': 'Total des Paiements Reçus',
      'payouts': 'paiements',
      'no_payments_found': 'Aucun paiement trouvé',
      'no_payouts_found': 'Aucun paiement trouvé',

      // Profile
      'email': 'E-mail',
      'phone': 'Téléphone',
      'linked': 'lié',
      'security_settings': 'Sécurité et Paramètres',
      'two_factor': 'Authentification à Deux Facteurs',
      'enabled': 'Activé',
      'disabled': 'Désactivé',
      'language': 'Langue',
      'support': 'Support',
      'help_center': 'Centre d\'Aide',
      'terms_privacy': 'Termes et Confidentialité',
      'logout': 'Se Déconnecter',
      'delete_account': 'Supprimer le compte',
      'delete_account_subtitle': 'Demander la fermeture définitive et l\'effacement des données',
      'delete_account_info': 'Comment fonctionne la suppression du compte',
      'delete_step_1_title': 'Vérification d\'identité',
      'delete_step_1_desc': 'Entrez votre mot de passe pour confirmer la propriété du compte.',
      'delete_step_2_title': 'Vérification des obligations',
      'delete_step_2_desc': 'Le système vérifie que toutes les rondes actives et cotisations sont réglées.',
      'delete_step_3_title': 'Examen par l\'administrateur',
      'delete_step_3_desc': 'Notre équipe examine et traite la demande sous 24 à 48 heures.',
      'delete_step_4_title': 'Suppression permanente',
      'delete_step_4_desc': 'Une fois approuvée, votre compte, cartes et données sont définitivement supprimés.',
      'enter_password_confirm': 'Entrez votre mot de passe pour confirmer',
      'reason_optional': 'Raison de la suppression (facultatif)',
      'submit_deletion_request': 'Soumettre la demande de suppression',
      'cancel': 'Annuler',
    };

  static final Map<String, String> _ht = {
      // Common
      'select_language': 'Chwazi lang ou',
      'continue': 'Kontinye',
      'save': 'Sove',
      'search': 'Chèche',
      'back': 'Retounen',
      'next': 'Pwochen',
      'skip': 'Sote pou kounye a',
      'version': 'Vèsyon',
      'active': 'Aktif',
      'pending': 'Anatant',
      'completed': 'Konplete',
      'failed': 'Echwe',
      'all': 'Tout',
      'see_all': 'Wè Tout',

      // Navigation
      'nav_home': 'Akèy',
      'nav_groups': 'Gwoup',
      'nav_payments': 'Peman',
      'nav_alerts': 'Avètisman',
      'nav_profile': 'Pwofil',

      // Auth - Login
      'login_title': 'Konekte pou Ekonomize',
      'login_subtitle': 'Kòmanse ekonomize ak zanmi ak fanmi ou.',
      'email_phone': 'Imèl oswa nimewo telefòn',
      'password': 'Modpas',
      'forgot_password': 'Ou bliye modpas ou?',
      'login_button': 'Konekte',
      'no_account': 'Ou pa gen yon kont? ',
      'signup_link': 'Enskri',
      'or_continue': 'OSWA KONTINYE AK',

      // Auth - Sign Up
      'signup_title': 'Enskri pou Ekonomize',
      'signup_subtitle': 'Kòmanse ekonomize ak zanmi ak fanmi ou.',
      'full_name': 'Non konplè',
      'first_name': 'Premye Non',
      'last_name': 'Siyati',
      'phone_number': 'Nimewo telefòn',
      'confirm_password': 'Konfime nouvo modpas',
      'agree_terms': 'Mwen dakò ak ',
      'terms_conditions': 'Tèm ak Kondisyon yo\n',
      'and': 'ak ',
      'privacy_policy': 'Règleman Konfidansyalite',
      'already_account': 'Ou deja gen yon kont? ',

      // Auth - Forgot Password
      'reset_password': 'Reyajiste Modpas',
      'reset_subtitle': 'Antre adrès imèl ou pou reyajiste modpas la',
      'email_address': 'Adrès Imèl',
      'send_reset_link': 'Voye Lyen Reyajisteman',
      'back_login': 'Retounen nan Koneksyon',

      // Auth - OTP
      'otp_title': 'OTP',
      'otp_subtitle': 'Antre OTP ou a pou reyajiste modpas la',
      'confirm_otp': 'Konfime OTP',
      'back_email': 'Retounen nan Imèl',

      // Auth - Set Password
      'set_password_title': 'Mete Modpas pou Ekonomize',
      'new_password': 'Nouvo Modpas',

      // Auth - Complete Profile
      'complete_profile_title': 'Ranpli pwofil ou',
      'complete_profile_subtitle': 'Ede nou konnen ou pi byen',
      'upload_picture': 'Telechaje foto pwofil',
      'dob': 'Dat Nesans',
      'occupation': 'Okipasyon',
      'occupation_hint': 'Antre okipasyon ou',
      'address': 'Adrès',
      'address_hint': 'Antre adrès ou',
      'city': 'Vil',
      'state': 'Eta',
      'zip_code': 'Kòd Postal',

      // Auth - Payment Method Link
      'link_payment_title': 'Lye metòd peman ou',
      'link_payment_subtitle':
          'Ajoute yon kont labank oswa kat pou\nkontribisyon otomatik',
      'bank_account': 'Kont Labank',
      'credit_card': 'Kat Kredi',
      'link_bank': 'Lye Kont Labank',
      'add_card': 'Ajoute Kat Debi/Kredi',
      'security_note':
          'Enfòmasyon bankè ou yo chifre ak an sekirite. Nou itilize sekirite nivo labank pou pwoteje done ou yo.',

      // Home
      'welcome_back': 'Byenveni tounen,',
      'total_saved': 'Total Ekonomize',
      'active_groups': 'Gwoup Aktif',
      'quick_actions': 'Aksyon Rapid',
      'create_group': 'Kreye Gwoup',
      'join_group': 'Antre nan Gwoup',
      'my_groups': 'Gwoup Mwen yo',
      'no_groups_joined': 'Ou poko antre nan okenn gwoup',
      'create_first_group': 'Kreye premye gwoup ou a',
      'monthly': 'chak mwa',
      'members': 'manm',
      'position': 'Pozisyon',

      // Groups
      'basic_info': 'Enfòmasyon Debaz',
      'group_name': 'Non Gwoup la',
      'group_name_hint': 'egz., Sèk Ekonomi Fanmi',
      'description': 'Deskripsyon',
      'description_hint': 'Dekri objektif gwoup sa a...',
      'contribution_settings': 'Paramèt Kontribisyon',
      'review_details': 'Revize Detay yo',
      'enter_invite_code': 'Antre Kòd Envitasyon',
      'invite_code_subtitle':
          'Mande administratè gwoup la kòd envitasyon an pou rantre nan gwoup ekonomi yo a',
      'enter_code_hint': 'ANTRE KÒD',
      'demo_codes': 'Eseye kòd demonstrasyon sa yo:',

      // Payment
      'payments': 'Peman yo',
      'payment_methods': 'Metòd Peman',
      'add_new': '+ Ajoute Nouvo',
      'recent_payments': 'Peman Dènye',
      'this_month': 'Mwa Sa a',
      'auto_payments_enabled': 'Peman Otomatik Aktive',
      'auto_payments_desc':
          'Kontribisyon ou yo dedwi otomatikman baze sou orè gwoup ou a. Ou pral resevwa yon notifikasyon anvan chak peman.',
      'payment_history': 'Istorik Peman',
      'total_contributed': 'Total Kontribye',
      'total_payout_received': 'Total Peman Resevwa',
      'payouts': 'peman',
      'no_payments_found': 'Pa gen okenn peman jwenn',
      'no_payouts_found': 'Pa gen okenn peman jwenn',

      // Profile
      'email': 'Imèl',
      'phone': 'Telefòn',
      'linked': 'lye',
      'security_settings': 'Sekirite ak Paramèt',
      'two_factor': 'Otantifikasyon De Faktè',
      'enabled': 'Aktive',
      'disabled': 'Dezaktive',
      'language': 'Lang',
      'support': 'Sipò',
      'help_center': 'Sant Èd',
      'terms_privacy': 'Tèm ak Konfidansyalite',
      'logout': 'Dekonekte',
      'delete_account': 'Efase Kont',
      'delete_account_subtitle': 'Mande fèmen kont nèt epi efase done yo',
      'delete_account_info': 'Kijan efase kont lan fonksyone',
      'delete_step_1_title': 'Verifikasyon Idantite',
      'delete_step_1_desc': 'Mete modpas ou pou konfime se kont pa w.',
      'delete_step_2_title': 'Verifikasyon Angajman',
      'delete_step_2_desc': 'Sistèm nan tcheke pou asire tout wonn ak peman yo regle.',
      'delete_step_3_title': 'Revizyon Administratè',
      'delete_step_3_desc': 'Ekip nou an ap revize epi trete demann lan nan 24-48 èdtan.',
      'delete_step_4_title': 'Efase Nèt',
      'delete_step_4_desc': 'Lè l apwouve, kont ou, kat ou ak tout done pèsonèl yo efase nèt.',
      'enter_password_confirm': 'Mete modpas ou pou konfime',
      'reason_optional': 'Rezon pou efase a (opsyonèl)',
      'submit_deletion_request': 'Soumèt Demann pou Efase',
      'cancel': 'Anile',
    };
}
