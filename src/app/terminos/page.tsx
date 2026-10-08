import { LegalPage } from "../privacidad/_components/LegalPage";
import { TERMS_AND_CONDITIONS } from "./copy";

export default function TerminosPage() {
  return <LegalPage documents={TERMS_AND_CONDITIONS} />;
}
