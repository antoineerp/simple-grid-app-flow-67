
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// Fonction pour obtenir le logo actuel
const getCurrentLogo = (): string => {
  const savedLogo = localStorage.getItem('appLogo');
  return savedLogo || "/lovable-uploads/4425c340-2ce3-416b-abc9-b75906ca8705.png";
};

// Fonction pour formater l'état
const formatState = (state: string | null | boolean): string => {
  if (state === 'NC') return 'Non Conforme';
  if (state === 'PC') return 'Partiellement Conforme';
  if (state === 'C') return 'Conforme';
  if (state === 'EX' || state === true) return 'Exclusion';
  return 'Non défini';
};

// Fonction pour formater les responsabilités
const formatResponsabilities = (responsabilites: { r: string[], a: string[], c: string[], i: string[] }): string => {
  let result = '';
  if (responsabilites.r.length > 0) result += `R: ${responsabilites.r.join(', ')} `;
  if (responsabilites.a.length > 0) result += `A: ${responsabilites.a.join(', ')} `;
  if (responsabilites.c.length > 0) result += `C: ${responsabilites.c.join(', ')} `;
  if (responsabilites.i.length > 0) result += `I: ${responsabilites.i.join(', ')}`;
  return result.trim();
};

// Fonction pour exporter les exigences en PDF
export const exportExigencesToPdf = (exigences: any[], title: string = 'Liste des exigences') => {
  const doc = new jsPDF();
  const logoPath = getCurrentLogo();
  
  // Date de génération
  const currentDate = format(new Date(), 'dd MMMM yyyy à HH:mm', { locale: fr });
  
  // Ajout du logo (s'adapte à l'image)
  const img = new Image();
  img.src = logoPath;
  
  img.onload = function() {
    const imgWidth = 30;
    const imgHeight = (img.height * imgWidth) / img.width;
    doc.addImage(img, 'PNG', 10, 10, imgWidth, imgHeight);
    
    // Ajout du titre
    doc.setFontSize(18);
    doc.text(title, 50, 20);
    
    // Ajout de la date
    doc.setFontSize(10);
    doc.text(`Généré le: ${currentDate}`, 10, 40);
    
    // Tableau des exigences
    const headers = [['Nom', 'Responsabilités', 'État']];
    
    const data = exigences.map(exigence => [
      exigence.nom,
      formatResponsabilities(exigence.responsabilites),
      exigence.exclusion ? 'Exclusion' : formatState(exigence.atteinte)
    ]);
    
    autoTable(doc, {
      startY: 45,
      head: headers,
      body: data,
      theme: 'grid',
      styles: { fontSize: 10, cellPadding: 5 },
      headStyles: { fillColor: [0, 48, 135], textColor: [255, 255, 255] },
      columnStyles: {
        0: { cellWidth: 70 },
        1: { cellWidth: 70 },
        2: { cellWidth: 50 }
      }
    });
    
    // Enregistrement du PDF
    doc.save(`${title.toLowerCase().replace(/ /g, '_')}_${format(new Date(), 'yyyyMMdd_HHmm')}.pdf`);
  };
};

// Fonction pour exporter les documents en PDF
export const exportDocumentsToPdf = (documents: any[], title: string = 'Gestion Documentaire') => {
  const doc = new jsPDF();
  const logoPath = getCurrentLogo();
  
  // Date de génération
  const currentDate = format(new Date(), 'dd MMMM yyyy à HH:mm', { locale: fr });
  
  // Ajout du logo (s'adapte à l'image)
  const img = new Image();
  img.src = logoPath;
  
  img.onload = function() {
    const imgWidth = 30;
    const imgHeight = (img.height * imgWidth) / img.width;
    doc.addImage(img, 'PNG', 10, 10, imgWidth, imgHeight);
    
    // Ajout du titre
    doc.setFontSize(18);
    doc.text(title, 50, 20);
    
    // Ajout de la date
    doc.setFontSize(10);
    doc.text(`Généré le: ${currentDate}`, 10, 40);
    
    // Tableau des documents
    const headers = [['Nom', 'Lien', 'Responsabilités', 'État']];
    
    const data = documents.map(doc => [
      doc.nom,
      doc.lien || '-',
      formatResponsabilities(doc.responsabilites),
      formatState(doc.etat)
    ]);
    
    autoTable(doc, {
      startY: 45,
      head: headers,
      body: data,
      theme: 'grid',
      styles: { fontSize: 10, cellPadding: 5 },
      headStyles: { fillColor: [0, 48, 135], textColor: [255, 255, 255] },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { cellWidth: 40 },
        2: { cellWidth: 60 },
        3: { cellWidth: 30 }
      }
    });
    
    // Enregistrement du PDF
    doc.save(`${title.toLowerCase().replace(/ /g, '_')}_${format(new Date(), 'yyyyMMdd_HHmm')}.pdf`);
  };
};

// Nouvelle fonction pour exporter les statistiques d'un collaborateur en PDF
export const exportCollaborateurStatsToPdf = (membre: any) => {
  const doc = new jsPDF();
  const logoPath = getCurrentLogo();
  
  // Date de génération
  const currentDate = format(new Date(), 'dd MMMM yyyy à HH:mm', { locale: fr });
  
  // Ajout du logo (s'adapte à l'image)
  const img = new Image();
  img.src = logoPath;
  
  img.onload = function() {
    const imgWidth = 30;
    const imgHeight = (img.height * imgWidth) / img.width;
    doc.addImage(img, 'PNG', 10, 10, imgWidth, imgHeight);
    
    // Ajout du titre
    const title = `Statistiques de ${membre.prenom} ${membre.nom} (${membre.initiales})`;
    doc.setFontSize(18);
    doc.text(title, 50, 20);
    
    // Ajout de la fonction
    doc.setFontSize(14);
    doc.text(`Fonction: ${membre.fonction}`, 50, 30);
    
    // Ajout de la date
    doc.setFontSize(10);
    doc.text(`Généré le: ${currentDate}`, 10, 40);
    
    // Table des statistiques pour les exigences
    const headersExigences = [['Type', 'Nombre']];
    const dataExigences = [
      ['Responsable (R)', membre.exigences.r],
      ['Approbateur (A)', membre.exigences.a],
      ['Consulté (C)', membre.exigences.c],
      ['Informé (I)', membre.exigences.i],
      ['Total', membre.exigences.r + membre.exigences.a + membre.exigences.c + membre.exigences.i]
    ];
    
    autoTable(doc, {
      startY: 50,
      head: headersExigences,
      body: dataExigences,
      theme: 'grid',
      styles: { fontSize: 10, cellPadding: 5 },
      headStyles: { fillColor: [0, 48, 135], textColor: [255, 255, 255] },
      tableWidth: 100,
      margin: { left: 50 }
    });
    
    // Titre pour les documents
    doc.setFontSize(14);
    doc.text('Documents', 50, doc.autoTable.previous.finalY + 15);
    
    // Table des statistiques pour les documents
    const headersDocuments = [['Type', 'Nombre']];
    const dataDocuments = [
      ['Responsable (R)', membre.documents.r],
      ['Approbateur (A)', membre.documents.a],
      ['Consulté (C)', membre.documents.c],
      ['Informé (I)', membre.documents.i],
      ['Total', membre.documents.r + membre.documents.a + membre.documents.c + membre.documents.i]
    ];
    
    autoTable(doc, {
      startY: doc.autoTable.previous.finalY + 20,
      head: headersDocuments,
      body: dataDocuments,
      theme: 'grid',
      styles: { fontSize: 10, cellPadding: 5 },
      headStyles: { fillColor: [0, 48, 135], textColor: [255, 255, 255] },
      tableWidth: 100,
      margin: { left: 50 }
    });
    
    // Total général
    const totalGeneral = 
      membre.exigences.r + membre.exigences.a + membre.exigences.c + membre.exigences.i +
      membre.documents.r + membre.documents.a + membre.documents.c + membre.documents.i;
    
    doc.setFontSize(14);
    doc.text(`Total des responsabilités: ${totalGeneral}`, 50, doc.autoTable.previous.finalY + 15);
    
    // Enregistrement du PDF
    const filename = `statistiques_${membre.prenom}_${membre.nom}_${format(new Date(), 'yyyyMMdd_HHmm')}.pdf`;
    doc.save(filename.toLowerCase().replace(/ /g, '_'));
  };
};
