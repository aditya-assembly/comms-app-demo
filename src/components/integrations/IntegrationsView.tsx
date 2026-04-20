import { useState } from "react";
import { Upload } from "@phosphor-icons/react";
import { CsvImportWizard } from "./csv-import-wizard";
import { ExportIntegrationsPanel } from "./export-integrations";

export function IntegrationsView() {
  const [wizardOpen, setWizardOpen] = useState(false);

  return (
    <div className="flex-1 overflow-y-auto p-6">
      {wizardOpen ? (
        <CsvImportWizard onClose={() => setWizardOpen(false)} />
      ) : (
        <div className="max-w-3xl mx-auto space-y-8">
          {/* Input */}
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Input
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setWizardOpen(true)}
                className="group relative flex flex-col items-start gap-3 rounded-xl border bg-white p-5 text-left shadow-sm transition-all hover:shadow-md hover:border-primary/40"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Upload size={20} weight="bold" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">CSV Import</h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Import participants from a CSV file. Map columns, review conflicts, and batch-create or update records.
                  </p>
                </div>
              </button>
            </div>
          </section>

          {/* Output */}
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Output
            </h2>
            <ExportIntegrationsPanel />
          </section>
        </div>
      )}
    </div>
  );
}
