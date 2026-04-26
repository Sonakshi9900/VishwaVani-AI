import * as pdfjsLib from 'pdfjs-dist';

// Configure the worker explicitly for Vite
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
).toString();

export const extractTextFromPdf = async (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = async function () {
            try {
                const typedarray = new Uint8Array(this.result);
                const pdf = await pdfjsLib.getDocument(typedarray).promise;
                const maxPages = pdf.numPages;
                let completeText = "";

                // Extract text from each page
                for (let j = 1; j <= maxPages; j++) {
                    const page = await pdf.getPage(j);
                    const textContent = await page.getTextContent();

                    let pageText = "";
                    let lastY = -1;

                    for (let item of textContent.items) {
                        const currentItem = item;
                        if (lastY == currentItem.transform[5] || lastY == -1) {
                            pageText += currentItem.str;
                        } else {
                            pageText += '\n' + currentItem.str;
                        }
                        lastY = currentItem.transform[5];
                    }

                    completeText += pageText + "\n\n";
                }

                resolve(completeText.trim());
            } catch (error) {
                console.error("PDF Parsing Error:", error);
                reject(new Error("Failed to extract text from PDF"));
            }
        };

        reader.onerror = () => {
            reject(new Error("Failed to read file"));
        };

        reader.readAsArrayBuffer(file);
    });
};
