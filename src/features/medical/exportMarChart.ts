import { MARChart } from '../../types';

export const generateMarChartDocx = async (chart: MARChart) => {
  const { Document, Packer, Paragraph, Table, TableRow, TableCell, WidthType } = await import('docx');
  const { saveAs } = await import('file-saver');

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({ text: `MAR Chart: ${chart.animalName}`, heading: 'Heading1' }),
          new Paragraph({ text: `Medication: ${chart.medication}` }),
          new Paragraph({ text: `Dosage: ${chart.dosage}` }),
          new Paragraph({ text: `Frequency: ${chart.frequency}` }),
          new Paragraph({ text: `Instructions: ${chart.instructions}` }),
          new Paragraph({ text: ' ' }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph('Date')] }),
                  new TableCell({ children: [new Paragraph('Time')] }),
                  new TableCell({ children: [new Paragraph('Initials')] }),
                  new TableCell({ children: [new Paragraph('Notes')] }),
                ],
              }),
              ...Array.from({ length: 7 }).map(() => new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph(' ')] }),
                  new TableCell({ children: [new Paragraph(' ')] }),
                  new TableCell({ children: [new Paragraph(' ')] }),
                  new TableCell({ children: [new Paragraph(' ')] }),
                ],
              })),
            ],
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `MAR_Chart_${chart.animalName}_${chart.medication}.docx`);
};
