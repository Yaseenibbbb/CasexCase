"use client"

import React, { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import {
  ArrowLeft,
  ArrowRight,
  Upload,
  X,
  BrainCircuit,
  Wand2,
  Check,
  ChevronsUpDown,
  Building2,
  MapPin,
  BookOpen,
  Gauge,
  Mic2,
  DatabaseZap,
  ListChecks,
  FileText,
  Loader2,
  PlusCircle,
  Building,
  Play,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"

// Placeholder for extensive company list
const COMPANIES_LIST = [
  { value: "google", label: "Google" },
  { value: "facebook", label: "Facebook (Meta)" },
  { value: "amazon", label: "Amazon" },
  { value: "apple", label: "Apple" },
  { value: "microsoft", label: "Microsoft" },
  { value: "netflix", label: "Netflix" },
  { value: "tesla", label: "Tesla" },
  { value: "mckinsey", label: "McKinsey & Company" },
  { value: "bcg", label: "Boston Consulting Group (BCG)" },
  { value: "bain", label: "Bain & Company" },
  { value: "deloitte", label: "Deloitte" },
  { value: "pwc", label: "PwC" },
  { value: "ey", label: "Ernst & Young (EY)" },
  { value: "kpmg", label: "KPMG" },
  { value: "goldman", label: "Goldman Sachs" },
  { value: "jpmorgan", label: "JPMorgan Chase" },
  { value: "morganstanley", label: "Morgan Stanley" },
  { value: "cocacola", label: "Coca-Cola" },
  { value: "pepsi", label: "PepsiCo" },
  { value: "proctergamble", label: "Procter & Gamble (P&G)" },
  { value: "unilever", label: "Unilever" },
  // Add many more entries here...
  { value: "other", label: "Other / Not Listed" },
].map(company => ({ ...company, lowerLabel: company.label.toLowerCase() })) // Precompute lowercase for search

const CASE_TYPES_OPTIONS = [
  { id: "sizing", label: "Market Sizing" },
  { id: "entry", label: "Market Entry" },
  { id: "profitability", label: "Profitability" },
  { id: "m&a", label: "M&A / Due Diligence" },
  { id: "pricing", label: "Pricing" },
  { id: "ops", label: "Operations Optimization" },
  { id: "growth", label: "Growth Strategy" },
  // Add more if needed
]

const FRAMEWORK_OPTIONS = [
  { value: "none", label: "None / Custom" },
  { value: "3c", label: "3 C's (Customer, Competitors, Company)" },
  { value: "4p", label: "4 P's (Product, Price, Place, Promotion)" },
  { value: "profit-eq", label: "Profitability Equation (Rev - Costs)" },
  { value: "value-chain", label: "Value Chain Analysis" },
]

interface CustomPrepFormProps {
  onClose?: () => void
}

const STEPS = [
  { id: 1, title: "Scenario Basics" },
  { id: 2, title: "Case Settings" },
  { id: 3, title: "Skills & Mode" },
  { id: 4, title: "Uploads & Review" },
]

// --- Debounce Hook --- (Basic implementation)
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}

// --- Type Definitions ---
interface CompanySearchResult {
  id: number;
  name: string;
  logo_url: string | null;
}

export const CustomPrepForm: React.FC<CustomPrepFormProps> = ({ onClose = () => {} }) => {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState({
    topic: "",
    companyValue: "",
    companyLabel: "",
    region: "",
    companySize: "",
    businessGoal: "",
    caseTypes: [] as string[],
    difficulty: 3,
    duration: 30,
    framework: "none",
    mathRigor: "balanced",
    hintMode: "light",
    stressLevel: "normal",
    voicePractice: false,
    file: null as File | null,
    liveData: false,
    sessionGoal: "drill",
  })
  const [comboboxOpen, setComboboxOpen] = useState(false)

  // State for Async Company Combobox
  const [companySearchQuery, setCompanySearchQuery] = useState("");
  const [companyResults, setCompanyResults] = useState<CompanySearchResult[]>([]);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(false);
  const [companyComboboxOpen, setCompanyComboboxOpen] = useState(false);
  const debouncedSearchQuery = useDebounce(companySearchQuery, 300); // Debounce input by 300ms

  // State for AI generation loading
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSliderChange = (name: string, value: number[]) => {
    setFormData((prev) => ({ ...prev, [name]: value[0] }))
  }

  const handleRadioChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData((prev) => ({ ...prev, [name]: checked }))
  }

  const handleCaseTypeToggle = (caseTypeId: string) => {
    setFormData((prev) => {
      const currentTypes = prev.caseTypes
      const isSelected = currentTypes.includes(caseTypeId)
      let newTypes: string[]

      if (isSelected) {
        newTypes = currentTypes.filter((id) => id !== caseTypeId)
      } else {
        if (currentTypes.length < 2) {
          newTypes = [...currentTypes, caseTypeId]
        } else {
          console.warn("Maximum 2 case types allowed.")
          newTypes = currentTypes
        }
      }
      return { ...prev, caseTypes: newTypes }
    })
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      if (event.target.files[0].size > 5 * 1024 * 1024) {
        alert("File size exceeds 5MB limit.")
        setFormData((prev) => ({ ...prev, file: null }))
        event.target.value = ''
        return
      }
      setFormData((prev) => ({ ...prev, file: event.target.files![0] }))
    } else {
      setFormData((prev) => ({ ...prev, file: null }))
    }
  }

  const handleGenerateDescription = async () => {
    if (!formData.topic) {
      alert("Please enter a topic first.");
      return;
    }
    
    setIsGeneratingDescription(true);
    try {
      console.log(`[AI Generate] Sending topic: "${formData.topic}"`);
      const response = await fetch('/api/generate-description', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ topic: formData.topic }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate description');
      }

      const { description } = await response.json();
      console.log(`[AI Generate] Received description: "${description}"`);

      if (description) {
        // Update the topic field with the AI-generated description
        setFormData((prev) => ({ ...prev, topic: description }));
      } else {
        throw new Error('Received empty description from AI.');
      }
    } catch (error) {
      console.error("Error generating AI description:", error);
      const message = error instanceof Error ? error.message : "An unknown error occurred.";
      alert(`AI description generation failed: ${message}`);
    } finally {
      setIsGeneratingDescription(false);
    }
  };

  const handleStartPrep = () => {
    console.log("Starting Custom Prep with data:", formData);
    onClose();
    // TODO: Implement navigation to /interview/[id] with custom setup
  }

  const progressValue = (currentStep / STEPS.length) * 100;

  // Fetch companies based on debounced query
  useEffect(() => {
    if (debouncedSearchQuery.length < 2) {
      setCompanyResults([]);
      setIsLoadingCompanies(false);
      return;
    }

    const fetchCompanies = async () => {
      setIsLoadingCompanies(true);
      try {
        // Call your LOCAL backend API route, which will securely use the API key
        const response = await fetch(`/api/companies?q=${encodeURIComponent(debouncedSearchQuery)}&limit=10`); 
        
        // --- Example Backend Logic for /api/companies --- 
        // const companiesApiKey = process.env.COMPANIES_API_KEY; // Read from environment variable
        // const externalApiUrl = `https://api.thecompaniesapi.com/v2/companies/by-name?name=${encodeURIComponent(debouncedSearchQuery)}&limit=10`; // Or use the appropriate search endpoint
        // const externalResponse = await fetch(externalApiUrl, {
        //   headers: {
        //     'Authorization': `Bearer ${companiesApiKey}` // Or 'Basic' depending on API docs
        //   }
        // });
        // // Process externalResponse and send back to frontend...
        // --- End Example Backend Logic --- 
        
        if (!response.ok) {
          throw new Error('Failed to fetch companies from local API');
        }
        const data: CompanySearchResult[] = await response.json();
        setCompanyResults(data);
      } catch (error) { 
        console.error("Error fetching companies:", error);
        setCompanyResults([]); 
      } finally {
        setIsLoadingCompanies(false);
      }
    };

    fetchCompanies();
  }, [debouncedSearchQuery]);

  // Handler for selecting a company from the async list
  const handleCompanySelect = (company: CompanySearchResult) => {
    setFormData(prev => ({
      ...prev,
      companyValue: company.id.toString(), // Assuming ID is the value
      companyLabel: company.name, // Store name for display
    }));
    setCompanySearchQuery(""); // Clear search query
    setCompanyResults([]); // Clear results
    setCompanyComboboxOpen(false); // Close popover
  };

  // Placeholder for opening the 'Add Custom Company' modal
  const handleAddCustomCompany = () => {
      console.log("Trigger 'Add Custom Company' modal");
      // TODO: Implement modal logic
      setCompanyComboboxOpen(false);
  };

  return (
    <Card className="w-full max-w-3xl mx-auto my-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg overflow-hidden">
      <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
        <div className="mb-2 flex justify-between text-sm font-medium text-muted-foreground">
          <span>Step {currentStep} of {STEPS.length}</span>
          <span>{Math.round(progressValue)}% Complete</span>
        </div>
        <Progress value={progressValue} className="w-full h-1.5 [&>div]:bg-blue-600" /> 
        <h2 className="text-lg font-semibold text-foreground mt-3">{STEPS[currentStep - 1].title}</h2>
      </div>
      
      <CardContent className="p-6 md:p-8 min-h-[400px]">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.3 }}
        >
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}
        </motion.div>
      </CardContent>

      <div className="flex justify-between items-center p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 rounded-b-xl">
         <Button
           variant="outline"
           onClick={handleBack}
           disabled={currentStep === 1}
           className="disabled:opacity-50 rounded-md border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
         >
            <ArrowLeft size={16} className="mr-1" />
            Back
         </Button>

         {currentStep < STEPS.length ? (
           <Button
            onClick={handleNext}
            disabled={currentStep === 1 && !formData.topic.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-sm px-5 disabled:opacity-50"
           >
             Continue
             <ArrowRight size={16} className="ml-1" />
            </Button>
         ) : (
            <Button
             onClick={handleStartPrep}
             className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-md shadow-sm px-5"
            > 
              Generate & Start Case
              <Play size={16} className="ml-1.5" /> 
             </Button>
         )}
      </div>
    </Card>
  )

  function renderStep1() {
    return (
      <div className="space-y-8">
        <p className="text-sm text-muted-foreground">Define the core elements of your practice case.</p>
        <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="topic">Specific Topic or Question *</Label>
            <div className="flex items-center gap-2">
              <Input
                id="topic"
                name="topic"
                placeholder="e.g., Should Coca-Cola enter the alcoholic beverage market?"
                value={formData.topic}
                onChange={handleInputChange}
                required
                className="flex-grow bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-md focus-visible:ring-blue-600/50 focus-visible:ring-2"
                disabled={isGeneratingDescription}
              />
              <Button 
                variant="outline"
                size="icon"
                onClick={handleGenerateDescription}
                title="Generate description with AI" 
                className="border-slate-200 dark:border-slate-800 text-blue-600 hover:bg-blue-600/10 shrink-0 w-9 h-9"
                disabled={isGeneratingDescription || !formData.topic}
              >
                {isGeneratingDescription ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Company / Organization (Optional)</Label>
            <Popover open={companyComboboxOpen} onOpenChange={setCompanyComboboxOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={companyComboboxOpen}
                  className="w-full justify-between bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-md font-normal text-left h-10 text-slate-600 dark:text-slate-300 data-[placeholder]:text-muted-foreground"
                >
                  <span className="truncate">{formData.companyLabel || "Select company..."}</span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] max-h-[--radix-popover-content-available-height] p-0">
                <Command shouldFilter={false}>
                  <CommandInput 
                    placeholder="Search company..." 
                    value={companySearchQuery}
                    onValueChange={setCompanySearchQuery}
                  />
                  <CommandList>
                    {isLoadingCompanies && <div className="p-2 text-sm text-center text-muted-foreground flex items-center justify-center"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading...</div>}
                    {!isLoadingCompanies && debouncedSearchQuery.length >= 2 && companyResults.length === 0 && <CommandEmpty>No company found.</CommandEmpty>}
                    {!isLoadingCompanies && companyResults.length > 0 && (
                      <CommandGroup>
                        {companyResults.map((company) => (
                          <CommandItem key={`${company.id}-${company.name}`} value={company.name} onSelect={() => handleCompanySelect(company)} className="flex items-center gap-2 cursor-pointer">
                            <img src={company.logo_url || `https://avatar.vercel.sh/${company.name}.png`} alt={`${company.name} logo`} className="h-6 w-6 object-contain rounded-sm flex-shrink-0" />
                            <span className="truncate">{company.name}</span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    )}
                    {!isLoadingCompanies && <CommandItem onSelect={handleAddCustomCompany} className="border-t border-slate-200 dark:border-slate-800 cursor-pointer text-blue-600 flex items-center gap-2 mt-1 pt-2"><PlusCircle size={16}/>Can't find it? Add custom →</CommandItem>}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="region">Geographic Focus (Optional)</Label>
            <Input id="region" name="region" placeholder="e.g., Southeast Asia, USA, Global" value={formData.region} onChange={handleInputChange} className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-md focus-visible:ring-blue-600/50 focus-visible:ring-2" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="companySize">Company Size (Optional)</Label>
            <Select name="companySize" value={formData.companySize} onValueChange={(value) => handleSelectChange("companySize", value)}>
              <SelectTrigger id="companySize" className="w-full bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-md focus-visible:ring-blue-600/50 focus-visible:ring-2">
                <SelectValue placeholder="Select size..." />
              </SelectTrigger>
              <SelectContent>
                 <SelectItem value="startup">Startup / Early Stage</SelectItem>
                 <SelectItem value="smb">Small-Medium Business (SMB)</SelectItem>
                 <SelectItem value="f500">Large Enterprise / Fortune 500</SelectItem>
               </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="businessGoal">Business Goal (Optional)</Label>
            <Select name="businessGoal" value={formData.businessGoal} onValueChange={(value) => handleSelectChange("businessGoal", value)}>
              <SelectTrigger id="businessGoal" className="w-full bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-md focus-visible:ring-blue-600/50 focus-visible:ring-2">
                <SelectValue placeholder="Select goal..." />
              </SelectTrigger>
              <SelectContent>
                 <SelectItem value="growth">Growth</SelectItem>
                 <SelectItem value="profitability">Profitability Improvement</SelectItem>
                 <SelectItem value="turnaround">Turnaround</SelectItem>
                 <SelectItem value="entry">Market Entry</SelectItem>
                 <SelectItem value="other">Other</SelectItem>
               </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    );
  }

  function renderStep2() {
    return (
      <div className="space-y-8">
        <p className="text-sm text-muted-foreground">Configure the type, difficulty, and length of the case.</p>
        
        <div className="space-y-3">
          <Label>Case Type(s) (Select up to 2)</Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-3 pt-1">
            {CASE_TYPES_OPTIONS.map((type) => (
              <div key={type.id} className="flex items-center space-x-2">
                <Checkbox id={`caseType-${type.id}`} checked={formData.caseTypes.includes(type.id)} onCheckedChange={() => handleCaseTypeToggle(type.id)} disabled={formData.caseTypes.length >= 2 && !formData.caseTypes.includes(type.id)} />
                <Label htmlFor={`caseType-${type.id}`} className="text-sm font-normal cursor-pointer select-none">{type.label}</Label>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="difficulty">Difficulty</Label>
          <div className="flex items-center gap-4 pt-1">
            <Slider id="difficulty" name="difficulty" min={1} max={5} step={1} value={[formData.difficulty]} onValueChange={(value) => handleSliderChange("difficulty", value)} className="flex-grow" />
            <span className="text-sm font-semibold w-12 text-right tabular-nums text-foreground">{formData.difficulty} / 5</span>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground px-1">
            <span>Easy</span><span>Balanced</span><span>Expert</span>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="duration">Practice Duration (minutes)</Label>
          <div className="flex items-center gap-4 pt-1">
            <Slider id="duration" name="duration" min={10} max={60} step={5} value={[formData.duration]} onValueChange={(value) => handleSliderChange("duration", value)} className="flex-grow" />
            <span className="text-sm font-semibold w-20 text-right tabular-nums text-foreground">{formData.duration} min</span>
          </div>
        </div>
      </div>
    );
  }

   function renderStep3() {
    return (
      <div className="space-y-8">
        <p className="text-sm text-muted-foreground">Customize the AI's focus and the interview style.</p>

        <div className="space-y-2">
          <Label htmlFor="framework">Preferred Framework (Optional)</Label>
          <Select name="framework" value={formData.framework} onValueChange={(value) => handleSelectChange("framework", value)}>
            <SelectTrigger id="framework" className="w-full bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-md focus-visible:ring-blue-600/50 focus-visible:ring-2">
              <SelectValue placeholder="Select a framework..." />
            </SelectTrigger>
            <SelectContent>
               {FRAMEWORK_OPTIONS.map(opt => (<SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>))}
             </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label>Numerical Rigor</Label>
            <RadioGroup name="mathRigor" value={formData.mathRigor} onValueChange={(value) => handleRadioChange("mathRigor", value)} className="space-y-1.5 pt-1">
              <div className="flex items-center space-x-2"><RadioGroupItem value="light" id="rigor-light" /><Label htmlFor="rigor-light" className="font-normal cursor-pointer select-none">Light</Label></div>
              <div className="flex items-center space-x-2"><RadioGroupItem value="balanced" id="rigor-balanced" /><Label htmlFor="rigor-balanced" className="font-normal cursor-pointer select-none">Balanced</Label></div>
              <div className="flex items-center space-x-2"><RadioGroupItem value="heavy" id="rigor-heavy" /><Label htmlFor="rigor-heavy" className="font-normal cursor-pointer select-none">Quant-Heavy</Label></div>
            </RadioGroup>
          </div>
          <div className="space-y-2">
            <Label>Hint Mode</Label>
            <RadioGroup name="hintMode" value={formData.hintMode} onValueChange={(value) => handleRadioChange("hintMode", value)} className="space-y-1.5 pt-1">
              <div className="flex items-center space-x-2"><RadioGroupItem value="off" id="hint-off" /><Label htmlFor="hint-off" className="font-normal cursor-pointer select-none">Off</Label></div>
              <div className="flex items-center space-x-2"><RadioGroupItem value="light" id="hint-light" /><Label htmlFor="hint-light" className="font-normal cursor-pointer select-none">Light</Label></div>
              <div className="flex items-center space-x-2"><RadioGroupItem value="adaptive" id="hint-adaptive" /><Label htmlFor="hint-adaptive" className="font-normal cursor-pointer select-none">Adaptive</Label></div>
            </RadioGroup>
          </div>
          <div className="space-y-2">
            <Label>Stress Level</Label>
            <RadioGroup name="stressLevel" value={formData.stressLevel} onValueChange={(value) => handleRadioChange("stressLevel", value)} className="space-y-1.5 pt-1">
              <div className="flex items-center space-x-2"><RadioGroupItem value="calm" id="stress-calm" /><Label htmlFor="stress-calm" className="font-normal cursor-pointer select-none">Calm</Label></div>
              <div className="flex items-center space-x-2"><RadioGroupItem value="normal" id="stress-normal" /><Label htmlFor="stress-normal" className="font-normal cursor-pointer select-none">Normal</Label></div>
              <div className="flex items-center space-x-2"><RadioGroupItem value="pressure" id="stress-pressure" /><Label htmlFor="stress-pressure" className="font-normal cursor-pointer select-none">Pressure</Label></div>
            </RadioGroup>
          </div>
        </div>

        <div className="flex items-center space-x-2 pt-4">
          <Checkbox id="voicePractice" name="voicePractice" checked={formData.voicePractice} onCheckedChange={(checked) => handleSwitchChange("voicePractice", checked as boolean)} />
          <Label htmlFor="voicePractice" className="text-sm font-medium flex items-center gap-1.5 cursor-pointer select-none">
            <Mic2 size={16}/> Enable Voice Practice & Speech Analysis
          </Label>
        </div>
      </div>
    );
  }

  function renderStep4() {
    return (
      <div className="space-y-8">
        <p className="text-sm text-muted-foreground">Optionally upload supporting documents and review your setup before starting.</p>
        
        <div className="space-y-2">
          <Label htmlFor="file">Upload Case Document (Optional, PDF/DOCX, max 5MB)</Label>
          <Input
            id="file"
            name="file"
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={handleFileChange}
            className="flex-grow bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-md file:mr-4 file:py-2 file:px-4 file:rounded-l-md file:border-0 file:text-sm file:font-semibold file:bg-blue-600/10 file:text-blue-600 hover:file:bg-blue-600/20 cursor-pointer focus-visible:ring-blue-600/50 focus-visible:ring-2"
          />
          {formData.file && (
              <p className="text-xs text-muted-foreground">Selected: {formData.file.name}</p>
          )}
        </div>

        <div className="flex items-center justify-between rounded-lg border p-4 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50">
          <div className="space-y-0.5">
              <Label htmlFor="liveData">Include Live Data (Simulated)</Label>
              <p className="text-xs text-muted-foreground">Allow the AI to incorporate simulated real-time data points.</p>
          </div>
          <Switch
            id="liveData"
            name="liveData"
            checked={formData.liveData}
            onCheckedChange={(checked) => handleSwitchChange("liveData", checked as boolean)}
          />
        </div>

        <div className="space-y-2">
          <Label>Session Goal</Label>
          <RadioGroup name="sessionGoal" value={formData.sessionGoal} onValueChange={(value) => handleRadioChange("sessionGoal", value)} className="flex flex-wrap gap-x-6 gap-y-2 pt-1">
            <div className="flex items-center space-x-2"><RadioGroupItem value="drill" id="goal-drill" /><Label htmlFor="goal-drill" className="font-normal cursor-pointer select-none">Drill Specific Skill</Label></div>
            <div className="flex items-center space-x-2"><RadioGroupItem value="practice" id="goal-practice" /><Label htmlFor="goal-practice" className="font-normal cursor-pointer select-none">Balanced Practice</Label></div>
            <div className="flex items-center space-x-2"><RadioGroupItem value="simulate" id="goal-simulate" /><Label htmlFor="goal-simulate" className="font-normal cursor-pointer select-none">Full Simulation</Label></div>
          </RadioGroup>
        </div>
        
        <div className="space-y-3 rounded-lg border bg-slate-50 dark:bg-slate-900/30 p-4 md:p-6 border-slate-200 dark:border-slate-800 mt-6">
          <h3 className="text-base font-semibold text-foreground">Review Your Custom Case Setup</h3>
          <ul className="text-sm text-muted-foreground grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
            <li><strong>Topic:</strong> <span className="text-foreground font-medium truncate block">{formData.topic || "-"}</span></li>
            <li><strong>Company:</strong> <span className="text-foreground font-medium">{formData.companyLabel || "-"}</span></li>
            <li><strong>Region:</strong> <span className="text-foreground font-medium">{formData.region || "-"}</span></li>
            <li><strong>Size:</strong> <span className="text-foreground font-medium">{formData.companySize || "-"}</span></li>
            <li><strong>Business Goal:</strong> <span className="text-foreground font-medium">{formData.businessGoal || "-"}</span></li> 
            <li><strong>Case Type(s):</strong> <span className="text-foreground font-medium">{formData.caseTypes.join(', ') || "Any"}</span></li>
            <li><strong>Difficulty:</strong> <span className="text-foreground font-medium">{formData.difficulty}/5</span></li>
            <li><strong>Duration:</strong> <span className="text-foreground font-medium">{formData.duration} min</span></li>
            <li><strong>Framework:</strong> <span className="text-foreground font-medium">{FRAMEWORK_OPTIONS.find(f=>f.value === formData.framework)?.label || "-"}</span></li>
            <li><strong>Math Rigor:</strong> <span className="text-foreground font-medium capitalize">{formData.mathRigor}</span></li>
            <li><strong>Hint Mode:</strong> <span className="text-foreground font-medium capitalize">{formData.hintMode}</span></li>
            <li><strong>Stress Level:</strong> <span className="text-foreground font-medium capitalize">{formData.stressLevel}</span></li>
            <li><strong>Voice Practice:</strong> <span className="text-foreground font-medium">{formData.voicePractice ? 'On' : 'Off'}</span></li>
            <li><strong>Document:</strong> <span className="text-foreground font-medium truncate block">{formData.file?.name || "None"}</span></li>
            <li><strong>Live Data:</strong> <span className="text-foreground font-medium">{formData.liveData ? 'On' : 'Off'}</span></li>
            <li><strong>Goal:</strong> <span className="text-foreground font-medium capitalize">{formData.sessionGoal}</span></li>
          </ul>
        </div>
      </div>
    );
  }
} 