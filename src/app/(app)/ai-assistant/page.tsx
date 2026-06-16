import { AIChat } from "@/components/ai/ai-chat";
import { PageHeader } from "@/components/page/page-header";

export default function AIAssistantPage() {
  return (
    <div>
      <PageHeader
        title="AI Assistant"
        description="Bilingual finance assistant for English, Indonesian, and mixed messages. Smart Capture turns transaction text into a safe preview and only saves after you confirm."
        badge="AI Ready"
      />
      <AIChat />
    </div>
  );
}
