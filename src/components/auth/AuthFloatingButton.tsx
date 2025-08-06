"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import { useModal } from "@/hooks/useModal";
import AppService from "@/api/AppService";
import { generateMatricule, generatePDF } from "@/utils/authUtils";
import { Etudiant, Titulaire } from "@/types/app.types";

// Simple Icons as inline SVGs
const UserCircleIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const EyeIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const EyeSlashIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L12 12m-3.122-3.122l6.366-6.366m6.366 6.366L21 21M12 12a3 3 0 01-3-3m0 0a3 3 0 013-3m-3 3a3 3 0 003 3" />
  </svg>
);

const ChevronLeftIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
);

// Simple UI Components
const Input = ({ className = "", onChange, ...props }: {
  className?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  [key: string]: any;
}) => (
  <input
    className={`w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${className}`}
    onChange={onChange}
    {...props}
  />
);

const Label = ({ children, className = "", ...props }: {
  children: React.ReactNode;
  className?: string;
  [key: string]: any;
}) => (
  <label className={`block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 ${className}`} {...props}>
    {children}
  </label>
);

const Select = ({ options, defaultValue, onChange, className = "", ...props }: {
  options: Array<{value: string, label: string}>;
  defaultValue: string;
  onChange: (value: string) => void;
  className?: string;
  [key: string]: any;
}) => (
  <select
    className={`w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent ${className}`}
    value={defaultValue}
    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onChange(e.target.value)}
    {...props}
  >
    {options.map((option) => (
      <option key={option.value} value={option.value}>
        {option.label}
      </option>
    ))}
  </select>
);

type UserType = "etudiant" | "titulaire";
type RegisterStep = "identity" | "account" | "summary";

interface FormData {
  matricule: string;
  password: string;
  confirmPassword: string;
  nom: string;
  post_nom: string;
  prenom: string;
  sexe: "M" | "F";
  userType?: UserType;
}

export default function AuthFloatingButton() {
  const router = useRouter();
  const { isOpen, openModal, closeModal } = useModal();
  
  // États d'authentification
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState<Etudiant | Titulaire | null>(null);
  const [loggedUserType, setLoggedUserType] = useState<UserType | null>(null);
  
  // États du formulaire
  const [isSignUp, setIsSignUp] = useState(false);
  const [userType, setUserType] = useState<UserType>("etudiant");
  const [registerStep, setRegisterStep] = useState<RegisterStep>("identity");
  const [formData, setFormData] = useState<FormData>({
    matricule: "",
    password: "",
    confirmPassword: "",
    nom: "",
    post_nom: "",
    prenom: "",
    sexe: "M",
  });
  const [generatedMatricule, setGeneratedMatricule] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Vérifier l'état de connexion au chargement
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      const savedUserData = localStorage.getItem('userData');
      const savedUserType = localStorage.getItem('userType');
      
      if (token && savedUserData && savedUserType) {
        setIsLoggedIn(true);
        setUserData(JSON.parse(savedUserData));
        setLoggedUserType(savedUserType as UserType);
      }
    }
  }, []);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNextStep = () => {
    if (registerStep === "identity") {
      if (!formData.nom || !formData.post_nom || !formData.prenom) {
        alert("Veuillez remplir tous les champs obligatoires");
        return;
      }
      
      // Générer le matricule
      const matricule = generateMatricule();
      setGeneratedMatricule(matricule);
      setFormData(prev => ({ ...prev, matricule }));
      setRegisterStep("account");
    } else if (registerStep === "account") {
      if (!formData.password || !formData.confirmPassword || !userType) {
        alert("Veuillez remplir tous les champs");
        return;
      }
      
      if (formData.password !== formData.confirmPassword) {
        alert("Les mots de passe ne correspondent pas");
        return;
      }
      
      if (formData.password.length < 6) {
        alert("Le mot de passe doit contenir au moins 6 caractères");
        return;
      }
      
      setFormData(prev => ({ ...prev, userType }));
      setRegisterStep("summary");
    }
  };

  const handlePreviousStep = () => {
    if (registerStep === "account") {
      setRegisterStep("identity");
    } else if (registerStep === "summary") {
      setRegisterStep("account");
    }
  };

  const handlePrintSummary = () => {
    const userData = {
      ...formData,
      matricule: generatedMatricule
    };
    generatePDF(userData, userType);
  };

  const handleFinalSubmit = async () => {
    setLoading(true);
    try {
      const registrationData = {
        matricule: generatedMatricule,
        password: formData.password,
        nom: formData.nom,
        post_nom: formData.post_nom,
        prenom: formData.prenom,
        sexe: formData.sexe,
      };

      const appService = new AppService();
      let response;

      if (userType === "etudiant") {
        response = await appService.registerEtudiant(registrationData);
      } else {
        response = await appService.registerTitulaire(registrationData);
      }

      if (response.success) {
        alert(response.message || "Inscription réussie !");
        closeModal();
        
        // Réinitialiser le formulaire
        setIsSignUp(false);
        setRegisterStep("identity");
        setFormData({
          matricule: "",
          password: "",
          confirmPassword: "",
          nom: "",
          post_nom: "",
          prenom: "",
          sexe: "M",
        });
        setGeneratedMatricule("");
      } else {
        throw new Error(response.message || "Erreur lors de l'inscription");
      }
      
    } catch (error: any) {
      console.error("Erreur:", error);
      alert(error.message || "Une erreur s'est produite lors de l'inscription");
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const appService = new AppService();
      
      const loginData = {
        matricule: formData.matricule,
        password: formData.password,
      };
      
      let response;
      if (userType === "etudiant") {
        response = await appService.loginEtudiant(loginData);
        if(!response.success || !response.data) {
            throw new Error(response.message || "Erreur lors de la connexion de l'étudiant");
        }

        const { etudiant, token } = response.data;
        if (!etudiant || !token) {
          throw new Error("Données manquantes dans la réponse");
        }
        
        // Stocker les données
        localStorage.setItem('token', token);
        localStorage.setItem('userType', 'etudiant');
        localStorage.setItem('userData', JSON.stringify(etudiant));
        
        // Mettre à jour l'état local
        setIsLoggedIn(true);
        setLoggedUserType('etudiant');
        setUserData(etudiant);
        
        alert(response.message || "Connexion réussie !");
      } else {
        response = await appService.loginTitulaire(loginData);

        if(!response.success || !response.data) {
            throw new Error(response.message || "Erreur lors de la connexion du titulaire");
        }

        const { titulaire, token } = response.data;
        if (!titulaire || !token) {
          throw new Error("Données manquantes dans la réponse");
        }

        // Stocker les données
        localStorage.setItem('token', token);
        localStorage.setItem('userType', 'titulaire');
        localStorage.setItem('userData', JSON.stringify(titulaire));
        
        // Mettre à jour l'état local
        setIsLoggedIn(true);
        setLoggedUserType('titulaire');
        setUserData(titulaire);

        alert(response.message || "Connexion réussie !");
      }
      
      closeModal();
      
      // Réinitialiser le formulaire
      setFormData({
        matricule: "",
        password: "",
        confirmPassword: "",
        nom: "",
        post_nom: "",
        prenom: "",
        sexe: "M",
      });
      
    } catch (error: any) {
      console.error("Erreur:", error);
      alert(error.message || "Une erreur s'est produite");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    localStorage.removeItem('userType');
    setIsLoggedIn(false);
    setUserData(null);
    setLoggedUserType(null);
    closeModal();
    alert("Déconnexion réussie !");
  };

  const handleMenuItemClick = (item: string) => {
    switch(item) {
      case "Profile":
        router.push("/profile");
        break;
      case "Recharger compte":
        router.push("/recharge");
        break;
      case "Commandes":
        router.push("/commandes");
        break;
      case "Faire un retrait":
        router.push("/retrait");
        break;
      case "Travaux":
        router.push("/travaux");
        break;
      case "Se deconnecter":
        handleLogout();
        return;
    }
    closeModal();
  };

  const getUserMenuItems = () => {
    if (loggedUserType === "etudiant") {
      return ["Profile", "Recharger compte", "Commandes", "Se deconnecter"];
    } else {
      return ["Profile", "Faire un retrait", "Travaux", "Se deconnecter"];
    }
  };

  const toggleForm = () => {
    setIsSignUp(!isSignUp);
    setRegisterStep("identity");
    setFormData({
      matricule: "",
      password: "",
      confirmPassword: "",
      nom: "",
      post_nom: "",
      prenom: "",
      sexe: "M",
    });
    setGeneratedMatricule("");
  };

  const userTypeOptions = [
    { value: "etudiant", label: "Étudiant" },
    { value: "titulaire", label: "Titulaire" },
  ];

  const sexeOptions = [
    { value: "M", label: "Masculin" },
    { value: "F", label: "Féminin" },
  ];

  const getStepTitle = () => {
    if (!isSignUp) return "Se connecter";
    
    switch (registerStep) {
      case "identity":
        return "Étape 1/3 : Identité";
      case "account":
        return "Étape 2/3 : Compte";
      case "summary":
        return "Étape 3/3 : Résumé";
      default:
        return "Créer un compte";
    }
  };

  const getStepDescription = () => {
    if (!isSignUp) return "Connectez-vous pour accéder à votre espace";
    
    switch (registerStep) {
      case "identity":
        return "Renseignez vos informations personnelles";
      case "account":
        return "Choisissez votre type de compte et mot de passe";
      case "summary":
        return "Vérifiez vos informations avant validation";
      default:
        return "Créez votre compte en quelques étapes";
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={openModal}
        className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg transition-all duration-300 hover:scale-110"
        title="Connexion / Inscription"
      >
        <UserCircleIcon className="w-6 h-6" />
      </button>

      {/* Auth Modal */}
      <Modal 
        isOpen={isOpen} 
        onClose={closeModal} 
        className="max-w-[500px] m-4"
      >
        <div className="no-scrollbar relative w-full max-w-[500px] overflow-y-auto rounded-3xl bg-white p-6 dark:bg-gray-900 lg:p-8">
          {/* User Menu when logged in */}
          {isLoggedIn ? (
            <div className="space-y-6">
              {/* User Info Header */}
              <div className="text-center border-b border-gray-200 dark:border-gray-700 pb-4">
                <h4 className="text-xl font-semibold text-gray-800 dark:text-white">
                  {userData?.nom} {userData?.post_nom} {userData?.prenom}
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Matricule: {userData?.matricule}
                </p>
                <p className="text-sm text-blue-600 dark:text-blue-400 font-medium mt-1">
                  Solde: {(userData as any)?.solde || 0} FC
                </p>
              </div>

              {/* Menu Items */}
              <div className="space-y-2">
                {getUserMenuItems().map((item, index) => (
                  <button
                    key={index}
                    onClick={() => handleMenuItemClick(item)}
                    className={`w-full p-3 text-left rounded-lg transition-colors ${
                      item === "Se deconnecter"
                        ? "bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30"
                        : "bg-gray-50 text-gray-700 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div>
              {/* Header with back button for multi-step signup */}
              <div className="flex items-center mb-6">
                {isSignUp && registerStep !== "identity" && (
                  <button
                    type="button"
                    onClick={handlePreviousStep}
                    className="mr-3 p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <ChevronLeftIcon className="w-5 h-5" />
                  </button>
                )}
                <div className="flex-1 text-center">
                  <h4 className="text-2xl font-semibold text-gray-800 dark:text-white/90 mb-2">
                    {getStepTitle()}
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {getStepDescription()}
                  </p>
                </div>
              </div>

              {/* Login Form */}
              {!isSignUp && (
                <form onSubmit={handleLoginSubmit} className="space-y-5">
                  <div>
                    <Label>Type de compte</Label>
                    <Select
                      options={userTypeOptions}
                      defaultValue={userType}
                      onChange={(value) => setUserType(value as UserType)}
                    />
                  </div>

                  <div>
                    <Label>Matricule</Label>
                    <Input
                      type="text"
                      defaultValue={formData.matricule}
                      onChange={(e) => handleInputChange("matricule", e.target.value)}
                      placeholder="XX.YYYY.ZZ"
                    />
                  </div>

                  <div>
                    <Label>Mot de passe</Label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        defaultValue={formData.password}
                        onChange={(e) => handleInputChange("password", e.target.value)}
                        className="pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showPassword ? (
                          <EyeSlashIcon className="w-5 h-5" />
                        ) : (
                          <EyeIcon className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-4">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full px-5 py-3.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 rounded-lg transition-colors"
                    >
                      {loading ? "Connexion..." : "Se connecter"}
                    </button>
                    
                    <button
                      type="button"
                      onClick={toggleForm}
                      className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      Pas de compte ? S'inscrire
                    </button>
                  </div>
                </form>
              )}

              {/* Registration Form */}
              {isSignUp && (
                <div className="space-y-5">
                  {/* Step 1: Identity */}
                  {registerStep === "identity" && (
                    <div className="space-y-4">
                      <div>
                        <Label>Nom</Label>
                        <Input
                          type="text"
                          defaultValue={formData.nom}
                          onChange={(e) => handleInputChange("nom", e.target.value)}
                          placeholder="Votre nom"
                        />
                      </div>

                      <div>
                        <Label>Post-nom</Label>
                        <Input
                          type="text"
                          defaultValue={formData.post_nom}
                          onChange={(e) => handleInputChange("post_nom", e.target.value)}
                          placeholder="Votre post-nom"
                        />
                      </div>

                      <div>
                        <Label>Prénom</Label>
                        <Input
                          type="text"
                          defaultValue={formData.prenom}
                          onChange={(e) => handleInputChange("prenom", e.target.value)}
                          placeholder="Votre prénom"
                        />
                      </div>

                      <div>
                        <Label>Sexe</Label>
                        <Select
                          options={sexeOptions}
                          defaultValue={formData.sexe}
                          onChange={(value) => handleInputChange("sexe", value)}
                        />
                      </div>
                    </div>
                  )}

                  {/* Step 2: Account */}
                  {registerStep === "account" && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                        <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
                          <strong>Matricule généré:</strong>
                        </p>
                        <p className="font-mono text-lg font-semibold text-blue-600 dark:text-blue-400">
                          {generatedMatricule}
                        </p>
                      </div>

                      <div>
                        <Label>Type de compte</Label>
                        <Select
                          options={userTypeOptions}
                          defaultValue={userType}
                          onChange={(value) => setUserType(value as UserType)}
                        />
                      </div>

                      <div>
                        <Label>Mot de passe</Label>
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            defaultValue={formData.password}
                            onChange={(e) => handleInputChange("password", e.target.value)}
                            placeholder="Choisissez un mot de passe"
                            className="pr-12"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                          >
                            {showPassword ? (
                              <EyeSlashIcon className="w-5 h-5" />
                            ) : (
                              <EyeIcon className="w-5 h-5" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div>
                        <Label>Confirmer le mot de passe</Label>
                        <Input
                          type="password"
                          defaultValue={formData.confirmPassword}
                          onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                          placeholder="Répétez le mot de passe"
                        />
                      </div>
                    </div>
                  )}

                  {/* Step 3: Summary */}
                  {registerStep === "summary" && (
                    <div className="space-y-4">
                      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg space-y-3">
                        <h5 className="font-semibold text-gray-800 dark:text-white">
                          Résumé de votre inscription
                        </h5>
                        
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Nom complet:</span>
                            <span className="font-medium">
                              {formData.nom} {formData.post_nom} {formData.prenom}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Sexe:</span>
                            <span className="font-medium">
                              {formData.sexe === "M" ? "Masculin" : "Féminin"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Matricule:</span>
                            <span className="font-mono font-medium">{generatedMatricule}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Type de compte:</span>
                            <span className="font-medium capitalize">{userType}</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                        <p className="text-sm text-yellow-800 dark:text-yellow-200">
                          ⚠️ <strong>Important:</strong> Veuillez noter votre matricule. 
                          Vous en aurez besoin pour vous connecter.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Navigation Buttons */}
                  <div className="flex flex-col gap-4">
                    {registerStep === "summary" ? (
                      <>
                        <button
                          type="button"
                          onClick={handlePrintSummary}
                          className="w-full px-5 py-3.5 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 rounded-lg transition-colors"
                        >
                          📄 Imprimer le résumé (PDF)
                        </button>
                        <button
                          type="button"
                          onClick={handleFinalSubmit}
                          disabled={loading}
                          className="w-full px-5 py-3.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-400 rounded-lg transition-colors"
                        >
                          {loading ? "Validation..." : "✓ Valider l'inscription"}
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={handleNextStep}
                        className="w-full px-5 py-3.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                      >
                        Suivant →
                      </button>
                    )}
                    
                    <button
                      type="button"
                      onClick={toggleForm}
                      className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      Déjà un compte ? Se connecter
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}
