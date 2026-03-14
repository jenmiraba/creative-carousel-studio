import { useState, useEffect } from "react";
import Header from "@/components/carousel/Header";
import StepNav from "@/components/carousel/StepNav";
import ConfigPanel from "@/components/carousel/ConfigPanel";
import StepNotion from "@/components/carousel/StepNotion";
import StepContent from "@/components/carousel/StepContent";
import StepReview from "@/components/carousel/StepReview";
import StepCanva from "@/components/carousel/StepCanva";
import type { StepNumber, NotionPost, GeneratedData, FilterType } from "@/types/carousel";

const Index = () => {
  const [step, setStep] = useState<StepNumber>(1);
  const [posts, setPosts] = useState<NotionPost[]>([]);
  const [selectedPost, setSelectedPost] = useState<NotionPost | null>(null);
  const [canvaDesignId, setCanvaDesignId] = useState("");
  const [genData, setGenData] = useState<GeneratedData | null>(null);
  const [filter, setFilter] = useState<FilterType>("all");
  const [apiKeys, setApiKeys] = useState({ anthropic: "", notion: "", canva: "" });

  // Load saved keys
  useEffect(() => {
    const loaded = {
      anthropic: localStorage.getItem("cs_key_anthropic") || "",
      notion: localStorage.getItem("cs_key_notion") || "",
      canva: localStorage.getItem("cs_key_canva") || "",
    };
    setApiKeys(loaded);
  }, []);

  return (
    <div className="relative z-10 max-w-[960px] mx-auto px-5 py-8 pb-20">
      <Header />
      <ConfigPanel apiKeys={apiKeys} onChange={setApiKeys} />
      <StepNav current={step} onGo={setStep} />

      {step === 1 && (
        <StepNotion
          posts={posts}
          selectedPost={selectedPost}
          canvaDesignId={canvaDesignId}
          filter={filter}
          notionKey={apiKeys.notion}
          onPostsLoaded={setPosts}
          onSelectPost={setSelectedPost}
          onCanvaIdChange={setCanvaDesignId}
          onFilterChange={setFilter}
          onContinue={() => setStep(2)}
        />
      )}

      {step === 2 && (
        <StepContent
          selectedPost={selectedPost}
          anthropicKey={apiKeys.anthropic}
          onGenerated={setGenData}
          onNext={() => setStep(3)}
        />
      )}

      {step === 3 && (
        <StepReview
          genData={genData}
          onUpdate={setGenData}
          onBack={() => setStep(2)}
          onNext={() => setStep(4)}
        />
      )}

      {step === 4 && (
        <StepCanva
          genData={genData}
          selectedPost={selectedPost}
          canvaDesignId={canvaDesignId}
          canvaKey={apiKeys.canva}
          onBack={() => setStep(3)}
        />
      )}
    </div>
  );
};

export default Index;
