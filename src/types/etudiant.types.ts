type Recharges = {
    reference: string;
    amount: number;
    status: string;
    date_created: string;
    _id: string;
}

type Etudiant = {
    _id: string;
    nom: string;
    post_nom: string;
    prenom: string;
    matricule: string;
    sexe: "M" | "F";
    solde?: number;
    recharges?: Recharges[];
    password?: string;
}

type Commande = {
    _id: string;
    etudiantId: string;
    travailId: string;
    observations: string[];
    date_created: string;
}

export type { Recharges, Etudiant, Commande };
