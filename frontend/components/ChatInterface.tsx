import { useState, useRef, useEffect } from 'react';
import { useChatStore } from '../store/chatStore';
import { useMealPlanStore } from '../store/mealPlanStore';
import { Recipe } from '../store/mealPlanStore';
import { useRecipeStore } from '../store/recipeStore';
import ReactMarkdown from 'react-markdown';
import { useRouter } from 'next/router';

// Add custom styles for markdown content
const markdownStyles = `
  .markdown-content h1 {
    font-size: 1.8rem;
    font-weight: 700;
    margin-top: 1rem;
    margin-bottom: 0.75rem;
    color: #2563eb;
  }
  
  .markdown-content h2 {
    font-size: 1.5rem;
    font-weight: 600;
    margin-top: 0.75rem;
    margin-bottom: 0.5rem;
    color: #4b5563;
  }
  
  .markdown-content h3 {
    font-size: 1.25rem;
    font-weight: 600;
    margin-top: 0.5rem;
    margin-bottom: 0.5rem;
  }
  
  .markdown-content ul, .markdown-content ol {
    margin-left: 1.5rem;
    margin-bottom: 1rem;
  }
  
  .markdown-content li {
    margin-bottom: 0.25rem;
  }
  
  .markdown-content p {
    margin-bottom: 0.75rem;
  }
  
  .markdown-content strong {
    font-weight: 700;
    color: #374151;
  }
  
  .markdown-content em {
    font-style: italic;
    color: #4b5563;
  }

  /* Fix for text overflowing chat bubbles */
  .markdown-content {
    overflow-wrap: break-word;
    word-wrap: break-word;
    word-break: break-word;
    hyphens: auto;
    max-width: 100%;
  }

  .markdown-content pre {
    white-space: pre-wrap;
    overflow-x: auto;
    max-width: 100%;
  }

  .markdown-content code {
    white-space: pre-wrap;
    word-break: break-all;
  }

  .markdown-content table {
    width: 100%;
    table-layout: fixed;
    overflow-wrap: break-word;
  }

  .markdown-content img {
    max-width: 100%;
    height: auto;
  }
`;

// Add styles to hide scrollbar on textarea
const textareaStyles = `
  .no-scrollbar {
    scrollbar-width: none;
    -ms-overflow-style: none;
  }
  
  .no-scrollbar::-webkit-scrollbar {
    display: none;
  }
`;

export default function ChatInterface() {
  const router = useRouter();
  const { chats, activeChatId, sendMessage, isLoading, error } = useChatStore();
  const { currentPlan, addRecipeToMealPlan } = useMealPlanStore();
  const { addRecommendedRecipe } = useRecipeStore();
  const [input, setInput] = useState('');
  const [showMealTypeDropdown, setShowMealTypeDropdown] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<string | null>(null);
  const [selectedRecipeTitle, setSelectedRecipeTitle] = useState('');
  const [selectedRecipeData, setSelectedRecipeData] = useState<any>(null);
  const [debugMessage, setDebugMessage] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  const activeChat = chats.find(chat => chat.id === activeChatId);
  const messages = activeChat?.messages || [];
  
  // Helper function to extract nutritional info from raw text
  const extractNutritionalInfo = (text: string) => {
    // Default values
    let calories = 0, protein = 0, carbs = 0, fat = 0, fiber = 0;
    
    if (!text || typeof text !== 'string') return { calories, protein, carbs, fat, fiber };
    
    // Try to match common nutritional info patterns
    const calorieMatch = text.match(/calories:?\s*(\d+)(?:\s*kcal)?/i) ||
                         text.match(/(\d+)\s*calories/i) ||
                         text.match(/(\d+)\s*kcal/i) ||
                         text.match(/(\d+)\s*cal/i) ||
                         text.match(/energy:?\s*(\d+)/i);
    
    const proteinMatch = text.match(/protein:?\s*(\d+)(?:g)?/i) ||
                         text.match(/(\d+)g\s*protein/i) ||
                         text.match(/protein\s*-\s*(\d+)g/i);
    
    const carbsMatch = text.match(/carbs:?\s*(\d+)(?:g)?/i) ||
                       text.match(/carbohydrates:?\s*(\d+)(?:g)?/i) ||
                       text.match(/(\d+)g\s*carbs/i) ||
                       text.match(/(\d+)g\s*carbohydrates/i) ||
                       text.match(/carbs\s*-\s*(\d+)g/i);
    
    const fatMatch = text.match(/fat:?\s*(\d+)(?:g)?/i) ||
                     text.match(/(\d+)g\s*fat/i) ||
                     text.match(/fats:?\s*(\d+)(?:g)?/i) ||
                     text.match(/fat\s*-\s*(\d+)g/i);
    
    const fiberMatch = text.match(/fiber:?\s*(\d+)(?:g)?/i) ||
                       text.match(/(\d+)g\s*fiber/i) ||
                       text.match(/fibre:?\s*(\d+)(?:g)?/i) ||
                       text.match(/dietary fiber:?\s*(\d+)(?:g)?/i) ||
                       text.match(/fiber\s*-\s*(\d+)g/i);
    
    if (calorieMatch) calories = parseInt(calorieMatch[1]);
    if (proteinMatch) protein = parseInt(proteinMatch[1]);
    if (carbsMatch) carbs = parseInt(carbsMatch[1]);
    if (fatMatch) fat = parseInt(fatMatch[1]);
    if (fiberMatch) fiber = parseInt(fiberMatch[1]);
    
    console.log('[DEBUG] Extracted nutritional info:', { calories, protein, carbs, fat, fiber });
    return { calories, protein, carbs, fat, fiber };
  };
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);
  
  // Auto-resize textarea
  useEffect(() => {
    const textarea = inputRef.current;
    if (!textarea) return;
    
    const adjustHeight = () => {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    };
    
    // Initialize height
    adjustHeight();
    
    // Set up event listener for input changes
    textarea.addEventListener('input', adjustHeight);
    
    // Cleanup
    return () => {
      textarea.removeEventListener('input', adjustHeight);
    };
  }, [input]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    
    await sendMessage(input);
    setInput('');
    
    // Reset textarea height after sending
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };
  
  // Enhanced function to detect recipes and extract detailed information
  const detectRecipes = (content: string) => {
    console.log('[DEBUG] Detecting recipes in content');
    const recipes: any[] = [];
    
    // Parse content line by line
    const lines = content.split('\n');
    
    let currentRecipe: string | null = null;
    let currentIngredients: any[] = [];
    let currentInstructions: string[] = [];
    let rawNutritionalInfoLines: string[] = [];
    
    // Section tracking
    let inIngredientsSection = false;
    let inInstructionsSection = false;
    let inNutritionalInfoSection = false;
    
    // Enhanced regular expressions for recipe detection - expanded to catch more recipe patterns
    const recipeHeaderRegex = /(?:^|\n)(?:🍽️|🍳|🥗|🍲|🥘|🍚|🍝|🍗|🍖|🥩|🥞|🍋|🍔|🌮|🌯|🥤|🧃|🍵|🥪|#|\*|-)?\s*(.*?(?:recipe|bowl|salad|sandwich|meal|dish|breakfast|lunch|dinner|dessert|drink|smoothie|juice|lemonade|soup|cake|pie|stew|casserole|curry|stir-fry|pasta|burger|taco|wrap).*?)(?:\(.*?\))?\s*$/i;
    
    // First check if content generally looks like it contains a recipe
    const isRecipeContent = 
      content.toLowerCase().includes('ingredients') || 
      content.toLowerCase().includes('instructions') || 
      (content.toLowerCase().includes('recipe') && (
        content.toLowerCase().includes('cup') || 
        content.toLowerCase().includes('tbsp') || 
        content.toLowerCase().includes('tsp') || 
        content.toLowerCase().includes('oz') || 
        content.toLowerCase().includes('ml') || 
        content.toLowerCase().includes('g')
      ));
    
    // Do a first pass to find recipes or create one if none exists
    let recipeFound = false;
    
    // Check for any lines that might be recipe titles
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Check for recipe title patterns
      if ((line.match(/^(🍽️|🍳|🥗|🍲|🥘|🍚|🍝|🍗|🍖|🥩|🥞|🍋|🍔|🌮|🌯|🥤|🧃|🍵|🥪|#)/i) && line.length > 2) ||
          (line.match(/^#+\s+|^\*\s+|^-\s+/) && 
           (line.toLowerCase().includes('recipe') || 
            line.toLowerCase().includes('chicken') ||
            line.toLowerCase().includes('beef') ||
            line.toLowerCase().includes('pork') ||
            line.toLowerCase().includes('fish') ||
            line.toLowerCase().includes('salad') ||
            line.toLowerCase().includes('soup') ||
            line.toLowerCase().includes('stew') ||
            line.toLowerCase().includes('curry') ||
            line.toLowerCase().includes('pasta') ||
            line.toLowerCase().includes('bowl') ||
            line.toLowerCase().includes('sandwich') ||
            line.toLowerCase().includes('burger') ||
            line.toLowerCase().includes('taco') ||
            line.toLowerCase().includes('wrap') ||
            line.toLowerCase().includes('lemonade') ||
            line.toLowerCase().includes('smoothie') ||
            line.toLowerCase().includes('juice') ||
            line.toLowerCase().includes('dinner') ||
            line.toLowerCase().includes('breakfast') ||
            line.toLowerCase().includes('lunch') ||
            line.toLowerCase().includes('dessert') ||
            line.toLowerCase().includes('cake') ||
            line.toLowerCase().includes('pie') ||
            line.toLowerCase().includes('meal')))) {
        recipeFound = true;
        break;
      }
    }
    
    // If no recipe header found but content looks like a recipe, create a default recipe
    if (!recipeFound && isRecipeContent) {
      console.log('[DEBUG] No explicit recipe header found, but content looks like a recipe');
      
      // Try to infer a title from first few lines
      let title = "Recipe";
      
      // Look for best candidate for title in first several lines
      for (let i = 0; i < Math.min(10, lines.length); i++) {
        const line = lines[i].trim();
        if (line.length > 3 && 
            !line.startsWith('#') && 
            !line.match(/^[*\-•]/) && 
            !line.toLowerCase().includes('ingredients') && 
            !line.toLowerCase().includes('instructions') &&
            !line.toLowerCase().includes('directions')) {
          
          // Check if line contains food-related terms that might indicate a title
          const foodTerms = ['chicken', 'beef', 'pork', 'fish', 'salad', 'soup', 'stew', 'curry', 
                           'pasta', 'bowl', 'sandwich', 'burger', 'taco', 'wrap', 'lemonade', 
                           'smoothie', 'juice', 'cake', 'pie', 'bread', 'cookie'];
          
          let containsFoodTerm = false;
          for (const term of foodTerms) {
            if (line.toLowerCase().includes(term)) {
              containsFoodTerm = true;
              break;
            }
          }
          
          if (containsFoodTerm || i === 0) {
            title = line;
            break;
          }
        }
      }
      
      const recipeId = `recipe-${Date.now()}-0`;
      recipes.push({
        id: recipeId,
        title: title,
        startLineIndex: 0,
        endLineIndex: lines.length - 1,
        ingredients: [],
        instructions: [],
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        fiber: 0,
        prepTime: 0,
        cookTime: 0,
        totalTime: 0,
        servings: 0,
        nutritionSectionFound: false,
        ingredientSectionFound: false,
        instructionSectionFound: false,
        fullText: content,
      });
      
      currentRecipe = title;
      
      // Force section recognition to extract ingredients and instructions
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim().toLowerCase();
        
        if (line.includes('ingredients') || line.includes('you will need') || 
            line.includes('you\'ll need') || line.includes('what you need') ||
            (line.startsWith('for the') && line.length < 30)) {
          inIngredientsSection = true;
          inInstructionsSection = false;
          inNutritionalInfoSection = false;
          recipes[0].ingredientSectionFound = true;
          continue; // Skip this line
        }
        else if (line.includes('instructions') || line.includes('directions') || 
                line.includes('steps') || line.includes('how to make') || 
                line.includes('preparation') || line.includes('method') ||
                line.includes('to prepare')) {
          inIngredientsSection = false;
          inInstructionsSection = true;
          inNutritionalInfoSection = false;
          recipes[0].instructionSectionFound = true;
          continue; // Skip this line
        }
        else if (line.includes('nutrition') || line.includes('nutritional') ||
                line.includes('macros') || line.includes('calories')) {
          inIngredientsSection = false;
          inInstructionsSection = false;
          inNutritionalInfoSection = true;
          recipes[0].nutritionSectionFound = true;
          continue; // Skip this line
        }
        
        // Process line based on current section
        if (inIngredientsSection && 
            (line.startsWith('- ') || line.startsWith('* ') || 
             line.startsWith('• ') || /^\d+[\.\)]/.test(line) || 
             line.match(/\d+\s*(cups?|tbsp|tsp|oz|g|ml|lb)/i)) && 
            line.length > 3) {
          const cleanLine = line.replace(/^[*\-•]|\d+[\.\)]/, '').trim();
          currentIngredients.push({
            id: `ing-${currentIngredients.length + 1}`,
            name: cleanLine,
            amount: 0,
            unit: ''
          });
        }
        else if (inInstructionsSection && line.length > 5) {
          // For instructions, be more permissive - any non-empty line in instructions section
          const cleanLine = line.replace(/^\d+[\.\)]/, '').trim();
          if (cleanLine.length > 5) {
            currentInstructions.push(cleanLine);
          }
        }
        else if (inNutritionalInfoSection) {
          rawNutritionalInfoLines.push(lines[i]);
        }
        else if (!inIngredientsSection && !inInstructionsSection && !inNutritionalInfoSection) {
          // If we're not in any specific section, try to determine what this line might be
          
          // Check if line looks like an ingredient (has measurements or common food words)
          if ((line.match(/\d+\s*(cups?|tbsp|tsp|oz|g|ml|lb)/i) || 
              (line.match(/^[*\-•]|\d+[\.\)]/) && 
               (line.includes('sugar') || line.includes('salt') || line.includes('oil') || 
                line.includes('water') || line.includes('flour') || line.includes('butter') ||
                line.includes('garlic') || line.includes('onion'))))) {
            
            if (currentIngredients.length === 0) {
              // First ingredient found - mark the section as started
              inIngredientsSection = true;
              recipes[0].ingredientSectionFound = true;
            }
            
            const cleanLine = line.replace(/^[*\-•]|\d+[\.\)]/, '').trim();
            currentIngredients.push({
              id: `ing-${currentIngredients.length + 1}`,
              name: cleanLine,
              amount: 0,
              unit: ''
            });
          }
          // Check if line looks like an instruction step (has cooking verbs)
          else if ((line.match(/^\d+[\.\)]/) && line.length > 10) || 
                   (line.length > 20 && 
                    (line.includes('mix') || line.includes('stir') || line.includes('cook') || 
                     line.includes('add') || line.includes('heat') || line.includes('bake') || 
                     line.includes('boil') || line.includes('simmer')))) {
            
            if (currentInstructions.length === 0) {
              // First instruction found - mark the section as started
              inInstructionsSection = true;
              recipes[0].instructionSectionFound = true;
            }
            
            const cleanLine = line.replace(/^\d+[\.\)]/, '').trim();
            currentInstructions.push(cleanLine);
          }
        }
      }
      
      if (currentIngredients.length > 0) {
        recipes[0].ingredients = currentIngredients;
      }
      if (currentInstructions.length > 0) {
        recipes[0].instructions = currentInstructions;
      }
      if (rawNutritionalInfoLines.length > 0) {
        recipes[0].rawNutritionalInfo = rawNutritionalInfoLines.join('\n');
      }
      
      return recipes;
    }
    
    // Continue with existing recipe detection for structured recipes
    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      
      // Enhanced logic to detect recipe titles - include more patterns
      if ((trimmedLine.match(/^(🍽️|🍳|🥗|🍲|🥘|🍚|🍝|🍗|🍖|🥩|🥞|🍋|🥤|#)/i) && trimmedLine.length > 2) ||
          (trimmedLine.match(/^#+\s+/) && 
           (trimmedLine.toLowerCase().includes('recipe') || 
            trimmedLine.toLowerCase().includes('chicken') ||
            trimmedLine.toLowerCase().includes('salad') ||
            trimmedLine.toLowerCase().includes('bowl') ||
            trimmedLine.toLowerCase().includes('lemonade') ||
            trimmedLine.toLowerCase().includes('smoothie') ||
            trimmedLine.toLowerCase().includes('juice') ||
            trimmedLine.toLowerCase().includes('dinner') ||
            trimmedLine.toLowerCase().includes('breakfast') ||
            trimmedLine.toLowerCase().includes('lunch') ||
            trimmedLine.toLowerCase().includes('meal')))) {
        
        // Found a likely recipe title
        const titleMatch = trimmedLine.match(/^(?:🍽️|🍳|🥗|🍲|🥘|🍚|🍝|🍗|🍖|🥩|🥞|🍋|🥤|#+\s+)(.*)/i);
        const recipeTitle = titleMatch ? titleMatch[1].trim() : trimmedLine;
        
        console.log('[DEBUG] Found potential recipe:', recipeTitle);
        
        // Complete any previous recipe
        if (currentRecipe) {
          const existingRecipe = recipes.find(r => r.title === currentRecipe);
          if (existingRecipe) {
            existingRecipe.ingredients = currentIngredients;
            existingRecipe.instructions = currentInstructions;
            existingRecipe.rawNutritionalInfo = rawNutritionalInfoLines.join('\n');
            existingRecipe.endLineIndex = index - 1;
          }
        }
        
        // Start a new recipe
        const recipeId = `recipe-${Date.now()}-${recipes.length}`;
        recipes.push({
          id: recipeId,
          title: recipeTitle,
          startLineIndex: index,
          ingredients: [],
          instructions: [],
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
          fiber: 0,
          prepTime: 0,
          cookTime: 0,
          totalTime: 0,
          servings: 0,
          nutritionSectionFound: false,
          ingredientSectionFound: false,
          instructionSectionFound: false
        });
        
        currentRecipe = recipeTitle;
        currentIngredients = [];
        currentInstructions = [];
        rawNutritionalInfoLines = [];
        inIngredientsSection = false;
        inInstructionsSection = false;
        inNutritionalInfoSection = false;
      }
      
      // Detect section headers - better pattern matching for various formats
      if (/^\s*(?:ingredients|what you'll need|you'll need|shopping list)\s*:?\s*$/i.test(trimmedLine) ||
          trimmedLine.toLowerCase() === 'ingredients:' ||
          trimmedLine.toLowerCase() === 'ingredients') {
        inIngredientsSection = true;
        inInstructionsSection = false;
        inNutritionalInfoSection = false;
        console.log('[DEBUG] Found ingredients section header');
        
        // Update the recipe object to note this section
        if (currentRecipe) {
          const recipeObj = recipes.find(r => r.title === currentRecipe);
          if (recipeObj) {
            recipeObj.ingredientSectionFound = true;
          }
        }
        return; // Skip further processing for this line
      }
      
      if (/^\s*(?:instructions|directions|method|steps|preparation|how to make it|procedure)\s*:?\s*$/i.test(trimmedLine) ||
          trimmedLine.toLowerCase() === 'instructions:' ||
          trimmedLine.toLowerCase() === 'instructions' ||
          trimmedLine.toLowerCase() === 'directions:' ||
          trimmedLine.toLowerCase() === 'directions') {
        inIngredientsSection = false;
        inInstructionsSection = true;
        inNutritionalInfoSection = false;
        console.log('[DEBUG] Found instructions section header');
        
        // Update the recipe object to note this section
        if (currentRecipe) {
          const recipeObj = recipes.find(r => r.title === currentRecipe);
          if (recipeObj) {
            recipeObj.instructionSectionFound = true;
          }
        }
        return; // Skip further processing for this line
      }
      
      if (/^\s*(?:nutrition(?:al)? (?:info|information|facts|values)|macros|nutritional breakdown)\s*:?\s*$/i.test(trimmedLine) ||
          trimmedLine.toLowerCase() === 'nutrition:' ||
          trimmedLine.toLowerCase() === 'nutrition' ||
          trimmedLine.toLowerCase() === 'nutritional information:' ||
          trimmedLine.toLowerCase() === 'nutritional information') {
        inIngredientsSection = false;
        inInstructionsSection = false;
        inNutritionalInfoSection = true;
        console.log('[DEBUG] Found nutritional information section header');
        
        // Update the recipe object to note this section
        if (currentRecipe) {
          const recipeObj = recipes.find(r => r.title === currentRecipe);
          if (recipeObj) {
            recipeObj.nutritionSectionFound = true;
          }
        }
        return; // Skip further processing for this line
      }
      
      // If we're currently in a recipe, check what section we're in
      if (currentRecipe) {
        // Store raw nutritional info lines
        if (inNutritionalInfoSection) {
          // Skip the header line itself - this is already handled by the check above
          rawNutritionalInfoLines.push(line);
        }
        
        // Enhanced ingredient detection - more pattern matching approaches
        // 1. Parse ingredients with bullet points or numbers
        if ((trimmedLine.startsWith('* ') || trimmedLine.startsWith('- ') || 
             trimmedLine.startsWith('• ') || /^\d+[\.\)]/.test(trimmedLine)) &&
            (trimmedLine.length > 3) &&
            (inIngredientsSection || 
             (!inInstructionsSection && !inNutritionalInfoSection && currentIngredients.length < 20))) {
          
          // This is likely an ingredient with measurement
          let ingredientText = trimmedLine.replace(/^[*\-•]|\d+[\.\)]/, '').trim();
          
          // Log the detected ingredient line
          console.log('[DEBUG] Potential ingredient found:', ingredientText);
          
          // Try to extract amount and unit
          let amount = 0;
          let unit = "";
          let name = ingredientText;
          
          // Common pattern: "2 tbsp olive oil" or "1/2 cup milk"
          const measurementMatch = ingredientText.match(/^([\d\/\.\s]+)\s*([a-zA-Z]+)\s+(.+)$/);
          if (measurementMatch) {
            const [_, amountStr, unitStr, nameStr] = measurementMatch;
            
            // Parse fractional amounts like 1/2
            if (amountStr.includes('/')) {
              const fractionParts = amountStr.split('/');
              amount = parseFloat(fractionParts[0]) / parseFloat(fractionParts[1]);
            } else {
              amount = parseFloat(amountStr);
            }
            
            unit = unitStr;
            name = nameStr;
            
            console.log('[DEBUG] Extracted ingredient:', { name, amount, unit });
          } else {
            // Handle alternative format like "Olive oil - 2 tbsp"
            const altFormatMatch = ingredientText.match(/(.+?)[\s-]+(\d[\d\/\.\s]*)\s*([a-zA-Z]+)$/);
            if (altFormatMatch) {
              const [_, nameStr, amountStr, unitStr] = altFormatMatch;
              
              name = nameStr.trim();
              unit = unitStr;
              
              // Parse fractional amounts like 1/2
              if (amountStr.includes('/')) {
                const fractionParts = amountStr.split('/');
                amount = parseFloat(fractionParts[0]) / parseFloat(fractionParts[1]);
              } else {
                amount = parseFloat(amountStr);
              }
              
              console.log('[DEBUG] Extracted ingredient (alt format):', { name, amount, unit });
            } else {
              // If we can't extract structured data, just use the whole text as the name
              name = ingredientText;
              amount = 0;
              unit = ""; 
              
              // Try one more attempt to find a number with unit
              const numericMatch = ingredientText.match(/(\d+)(?:\s*)([a-zA-Z]+)/);
              if (numericMatch) {
                amount = parseFloat(numericMatch[1]);
                unit = numericMatch[2];
              }
              
              console.log('[DEBUG] Using ingredient name only:', name);
            }
          }
          
          // Create a valid ID whether we could extract structured data or not
          const ingredientId = `ing-${currentIngredients.length + 1}`;
          
          currentIngredients.push({
            id: ingredientId,
            name,
            amount: isNaN(amount) ? 0 : amount,
            unit
          });
          
          // Update the recipe object
          const recipeObj = recipes.find(r => r.title === currentRecipe);
          if (recipeObj) {
            recipeObj.ingredients = currentIngredients;
          }
        }
        
        // Improved instruction parsing - look for step-by-step patterns or paragraphs in instruction section
        if ((inInstructionsSection || (!inIngredientsSection && !inNutritionalInfoSection && currentInstructions.length > 0)) && 
            trimmedLine.length > 10) {
            
          // Check for numbered steps
          if (/^\d+[\.\)]/.test(trimmedLine)) {
            const instructionText = trimmedLine.replace(/^\d+[\.\)]/, '').trim();
            console.log('[DEBUG] Found numbered instruction:', instructionText.substring(0, 30) + '...');
            currentInstructions.push(instructionText);
            
            // Update the recipe object
            const recipeObj = recipes.find(r => r.title === currentRecipe);
            if (recipeObj) {
              recipeObj.instructions = currentInstructions;
            }
          } 
          // Check for paragraphs that might be instructions (when we're in instruction section)
          else if (inInstructionsSection && trimmedLine.length > 20 && !trimmedLine.match(/^[#*\-]/)) {
            console.log('[DEBUG] Found paragraph instruction:', trimmedLine.substring(0, 30) + '...');
            currentInstructions.push(trimmedLine);
            
            // Update the recipe object
            const recipeObj = recipes.find(r => r.title === currentRecipe);
            if (recipeObj) {
              recipeObj.instructions = currentInstructions;
            }
          }
        }
        
        // Enhanced nutrition information extraction
        if (inNutritionalInfoSection || 
            trimmedLine.toLowerCase().includes('cal') || 
            trimmedLine.toLowerCase().includes('protein') ||
            trimmedLine.toLowerCase().includes('carb') ||
            trimmedLine.toLowerCase().includes('fat') ||
            trimmedLine.toLowerCase().includes('fiber')) {
          
          console.log('[DEBUG] Found potential nutritional info:', trimmedLine);
          
          // Check if we're entering the nutritional information section
          if (trimmedLine.match(/^📊\s*nutritional/i) || 
              trimmedLine.toLowerCase().includes('nutritional information') ||
              trimmedLine.toLowerCase() === 'nutrition:') {
            // Mark that we're in a nutrition section but don't add this line to recipe
            inIngredientsSection = false;
            inInstructionsSection = false;
            inNutritionalInfoSection = true;
            console.log('[DEBUG] Entered nutritional information section');
            
            // Update the recipe object to note this section
            const recipeObj = recipes.find(r => r.title === currentRecipe);
            if (recipeObj) {
              recipeObj.nutritionSectionFound = true;
            }
            return; // Skip further processing for this line
          }
          
          // Enhanced calorie detection - handle more formats
          const calorieMatch = trimmedLine.match(/calories:?\s*(\d+)(?:\s*kcal)?/i) ||
                             trimmedLine.match(/(\d+)\s*calories/i) ||
                             trimmedLine.match(/(\d+)\s*kcal/i) ||
                             trimmedLine.match(/(\d+)\s*cal/i) ||
                             trimmedLine.match(/energy:?\s*(\d+)/i);
          
          // Enhanced protein detection
          const proteinMatch = trimmedLine.match(/protein:?\s*(\d+)(?:g)?/i) ||
                             trimmedLine.match(/(\d+)g\s*protein/i) ||
                             trimmedLine.match(/protein\s*-\s*(\d+)g/i);
          
          // Enhanced carbs detection
          const carbsMatch = trimmedLine.match(/carbs:?\s*(\d+)(?:g)?/i) ||
                           trimmedLine.match(/carbohydrates:?\s*(\d+)(?:g)?/i) ||
                           trimmedLine.match(/(\d+)g\s*carbs/i) ||
                           trimmedLine.match(/(\d+)g\s*carbohydrates/i) ||
                           trimmedLine.match(/carbs\s*-\s*(\d+)g/i);
          
          // Enhanced fat detection
          const fatMatch = trimmedLine.match(/fat:?\s*(\d+)(?:g)?/i) ||
                         trimmedLine.match(/(\d+)g\s*fat/i) ||
                         trimmedLine.match(/fats:?\s*(\d+)(?:g)?/i) ||
                         trimmedLine.match(/fat\s*-\s*(\d+)g/i);
          
          // Enhanced fiber detection
          const fiberMatch = trimmedLine.match(/fiber:?\s*(\d+)(?:g)?/i) ||
                           trimmedLine.match(/(\d+)g\s*fiber/i) ||
                           trimmedLine.match(/fibre:?\s*(\d+)(?:g)?/i) ||
                           trimmedLine.match(/dietary fiber:?\s*(\d+)(?:g)?/i) ||
                           trimmedLine.match(/fiber\s*-\s*(\d+)g/i);
          
          const recipeObj = recipes.find(r => r.title === currentRecipe);
          if (recipeObj) {
            if (calorieMatch) {
              recipeObj.calories = parseInt(calorieMatch[1]);
              console.log('[DEBUG] Extracted calories:', recipeObj.calories);
            }
            if (proteinMatch) {
              recipeObj.protein = parseInt(proteinMatch[1]);
              console.log('[DEBUG] Extracted protein:', recipeObj.protein);
            }
            if (carbsMatch) {
              recipeObj.carbs = parseInt(carbsMatch[1]);
              console.log('[DEBUG] Extracted carbs:', recipeObj.carbs);
            }
            if (fatMatch) {
              recipeObj.fat = parseInt(fatMatch[1]);
              console.log('[DEBUG] Extracted fat:', recipeObj.fat);
            }
            if (fiberMatch) {
              recipeObj.fiber = parseInt(fiberMatch[1]);
              console.log('[DEBUG] Extracted fiber:', recipeObj.fiber);
            }
          }
        }
        
        // Detect prep/cook time
        const prepTimeMatch = trimmedLine.match(/prep(?:aration)?\s*time:?\s*(\d+)\s*min/i) ||
                            trimmedLine.match(/prep:?\s*(\d+)\s*min/i);
        
        const cookTimeMatch = trimmedLine.match(/cook(?:ing)?\s*time:?\s*(\d+)\s*min/i) ||
                            trimmedLine.match(/cook:?\s*(\d+)\s*min/i);
        
        const totalTimeMatch = trimmedLine.match(/total\s*time:?\s*(\d+)\s*min/i);
        
        const servingsMatch = trimmedLine.match(/servings:?\s*(\d+)/i) ||
                           trimmedLine.match(/serves:?\s*(\d+)/i) ||
                           trimmedLine.match(/yield:?\s*(\d+)\s*servings/i);
                    
        const recipeObj = recipes.find(r => r.title === currentRecipe);
        if (recipeObj) {
          if (prepTimeMatch) {
            recipeObj.prepTime = parseInt(prepTimeMatch[1]);
          }
          if (cookTimeMatch) {
            recipeObj.cookTime = parseInt(cookTimeMatch[1]);
          }
          if (totalTimeMatch) {
            recipeObj.totalTime = parseInt(totalTimeMatch[1]);
          }
          if (servingsMatch) {
            recipeObj.servings = parseInt(servingsMatch[1]);
          }
        }
      }
    });
    
    // Complete any pending recipe
    if (currentRecipe) {
      const existingRecipe = recipes.find(r => r.title === currentRecipe);
      if (existingRecipe) {
        existingRecipe.ingredients = currentIngredients;
        existingRecipe.instructions = currentInstructions;
        existingRecipe.rawNutritionalInfo = rawNutritionalInfoLines.join('\n');
        existingRecipe.endLineIndex = lines.length - 1;
        console.log('[DEBUG] Final recipe completed:', existingRecipe.title);
      }
    }
    
    // Extract the full recipe text for each recipe
    recipes.forEach(recipe => {
      if (recipe.startLineIndex !== undefined && recipe.endLineIndex !== undefined) {
        // Extract the specific part of the content for this recipe
        const recipeLines = lines.slice(recipe.startLineIndex, recipe.endLineIndex + 1);
        recipe.fullText = recipeLines.join('\n');
      }
    });
    
    console.log('[DEBUG] Total recipes found:', recipes.length);
    if (recipes.length > 0) {
      console.log('[DEBUG] First recipe:', recipes[0].title);
    }
    
    return recipes;
  };
  
  // Function to handle adding a recipe to meal plan
  const handleAddRecipe = (recipeId: string, recipeTitle: string, recipeData: any) => {
    console.log('[DEBUG] handleAddRecipe called with:', { recipeId, recipeTitle });
    console.log('[DEBUG] Recipe data:', recipeData);

    setSelectedRecipe(recipeId);
    setSelectedRecipeTitle(recipeTitle);
    
    // Store the full recipe data for use when adding to meal plan
    setSelectedRecipeData(recipeData);
    
    setShowMealTypeDropdown(true);
  };
  
  // Function to add recipe to specific meal type
  const addToMealType = (mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack') => {
    console.log('[DEBUG] addToMealType called with mealType:', mealType);
    
    if (!selectedRecipe) {
      console.error('[DEBUG] No recipe selected');
      return;
    }
    
    try {
      // Ensure the ingredients array has the correct structure
      let formattedIngredients = [];
      
      if (Array.isArray(selectedRecipeData?.ingredients) && selectedRecipeData.ingredients.length > 0) {
        formattedIngredients = selectedRecipeData.ingredients;
      } else {
        console.log('[DEBUG] Creating default ingredients from full text');
        // Extract ingredient text from the full recipe if we couldn't parse it properly
        const recipeText = selectedRecipeData?.fullText || '';
        
        // Enhanced regex to extract ingredient section
        const ingredientsMatch = recipeText.match(/ingredients[\s\S]*?(?:(?:instructions|directions|steps|preparation|method):?|$)/i);
        
        if (ingredientsMatch && ingredientsMatch[0]) {
          // Try to extract bullet points or lines that look like ingredients
          const ingredientLines = ingredientsMatch[0].split('\n')
            .map((line: string) => line.trim())
            .filter((line: string) => 
              (line.startsWith('•') || 
              line.startsWith('-') || 
              line.startsWith('*') || 
              /^\d+[\.\)]/.test(line)) && 
              line.length > 3 &&
              !line.toLowerCase().includes('ingredients:')
            )
            .map((line: string) => line.replace(/^[•\-*]|\d+[\.\)]/, '').trim());
          
          if (ingredientLines.length > 0) {
            console.log('[DEBUG] Extracted ingredient lines:', ingredientLines.length);
            formattedIngredients = ingredientLines.map((text: string, i: number) => ({
              id: `ing-${i+1}`,
              name: text,
              amount: 0,
              unit: ''
            }));
          } else {
            // Try to extract any lines that might look like ingredients (with quantities or common food terms)
            const allTextLines = ingredientsMatch[0].split('\n')
              .map((line: string) => line.trim())
              .filter((line: string) => 
                line.length > 3 && 
                !line.toLowerCase().includes('ingredients:') &&
                (
                  /\d+\s*(?:g|oz|cups?|tbsp|tsp|pound|lb)/.test(line) ||  // Has measurement
                  /(?:chicken|beef|pork|fish|salt|pepper|oil|butter|garlic|onion|lemon|sugar|water)/.test(line.toLowerCase()) // Has common ingredient
                )
              );
              
            if (allTextLines.length > 0) {
              console.log('[DEBUG] Extracted text lines as ingredients:', allTextLines.length);
              formattedIngredients = allTextLines.map((text: string, i: number) => ({
                id: `ing-${i+1}`,
                name: text,
                amount: 0,
                unit: ''
              }));
            } else {
              // Check if it's a lemonade or beverage recipe and provide default ingredients
              const isLemonade = selectedRecipeTitle.toLowerCase().includes('lemonade');
              const isBeverage = isLemonade || 
                                selectedRecipeTitle.toLowerCase().includes('juice') || 
                                selectedRecipeTitle.toLowerCase().includes('smoothie');
              
              if (isLemonade) {
                console.log('[DEBUG] Adding default lemonade ingredients');
                formattedIngredients = [
                  {
                    id: 'ing-1',
                    name: 'Lemons',
                    amount: 4,
                    unit: ''
                  },
                  {
                    id: 'ing-2',
                    name: 'Sugar',
                    amount: 0.5,
                    unit: 'cup'
                  },
                  {
                    id: 'ing-3',
                    name: 'Water',
                    amount: 4,
                    unit: 'cups'
                  },
                  {
                    id: 'ing-4',
                    name: 'Ice',
                    amount: 1,
                    unit: 'cup'
                  }
                ];
              } else if (isBeverage) {
                console.log('[DEBUG] Adding default beverage ingredients');
                formattedIngredients = [
                  {
                    id: 'ing-1',
                    name: 'Main ingredient (fruit or base)',
                    amount: 2,
                    unit: 'cups'
                  },
                  {
                    id: 'ing-2',
                    name: 'Liquid (water or juice)',
                    amount: 1,
                    unit: 'cup'
                  },
                  {
                    id: 'ing-3',
                    name: 'Sweetener (optional)',
                    amount: 2,
                    unit: 'tbsp'
                  }
                ];
              } else {
                formattedIngredients = [
                  {
                    id: 'ing-default-1',
                    name: 'Ingredients extracted from recipe',
                    amount: 0,
                    unit: ''
                  }
                ];
              }
            }
          }
        } else {
          // Check if this is a lemonade recipe and provide default ingredients if so
          if (selectedRecipeTitle.toLowerCase().includes('lemonade')) {
            console.log('[DEBUG] Adding default lemonade ingredients');
            formattedIngredients = [
              {
                id: 'ing-1',
                name: 'Lemons',
                amount: 4,
                unit: ''
              },
              {
                id: 'ing-2',
                name: 'Sugar',
                amount: 0.5,
                unit: 'cup'
              },
              {
                id: 'ing-3',
                name: 'Water',
                amount: 4,
                unit: 'cups'
              },
              {
                id: 'ing-4',
                name: 'Ice',
                amount: 1,
                unit: 'cup'
              }
            ];
          } else {
            // Default fallback
            formattedIngredients = [
              {
                id: 'ing-default-1',
                name: 'Ingredients extracted from recipe',
                amount: 0,
                unit: ''
              }
            ];
          }
        }
      }
      
      // Ensure the instructions array has the correct structure
      let formattedInstructions = [];
      
      if (Array.isArray(selectedRecipeData?.instructions) && selectedRecipeData.instructions.length > 0) {
        formattedInstructions = selectedRecipeData.instructions;
      } else {
        console.log('[DEBUG] Creating instructions from recipe text');
        // Try to extract instructions from the full text
        const recipeText = selectedRecipeData?.fullText || '';
        
        // Enhanced regex to extract instructions section
        const instructionsMatch = recipeText.match(/(?:instructions|directions|steps|preparation|method|how to prepare|how to make):?[\s\S]*?(?:(?:nutrition|nutritional information|notes|tips):?|$)/i);
        
        if (instructionsMatch && instructionsMatch[0]) {
          // First try to extract numbered steps
          const numberedSteps = instructionsMatch[0].split('\n')
            .map((line: string) => line.trim())
            .filter((line: string) => /^\d+[\.\)]/.test(line) && line.length > 10)
            .map((line: string) => line.replace(/^\d+[\.\)]/, '').trim());
          
          if (numberedSteps.length > 0) {
            console.log('[DEBUG] Extracted numbered instruction steps:', numberedSteps.length);
            formattedInstructions = numberedSteps;
          } else {
            // Try to extract paragraphs that might be instructions
            const paragraphs = instructionsMatch[0].split('\n')
              .map((line: string) => line.trim())
              .filter((line: string) => 
                line.length > 20 && 
                !line.toLowerCase().match(/^(?:instructions|directions|steps|preparation|method):?/) &&
                !line.match(/^[#*\-]/)
              );
            
            if (paragraphs.length > 0) {
              console.log('[DEBUG] Extracted paragraphs as instructions:', paragraphs.length);
              formattedInstructions = paragraphs;
            } else {
              // Last resort - grab everything after "Instructions:" that's not empty
              const allLines = instructionsMatch[0].split('\n')
                .map((line: string) => line.trim())
                .filter((line: string) => 
                  line.length > 10 && 
                  !line.toLowerCase().match(/^(?:instructions|directions|steps|preparation|method):?/)
                );
              
              if (allLines.length > 0) {
                console.log('[DEBUG] Extracted remaining lines as instructions:', allLines.length);
                formattedInstructions = allLines;
              } else {
                formattedInstructions = ['Follow the preparation steps as described in the recipe.'];
              }
            }
          }
        } else {
          formattedInstructions = ['Follow the preparation steps as described in the recipe.'];
        }
      }
      
      // If instructions are still missing, check if it's a beverage recipe and provide defaults
      if (formattedInstructions.length === 0 || 
          (formattedInstructions.length === 1 && 
          formattedInstructions[0] === 'Follow the preparation steps as described in the recipe.')) {
        
        // Check for beverage-specific defaults
        if (selectedRecipeTitle.toLowerCase().includes('lemonade')) {
          console.log('[DEBUG] Adding default lemonade instructions');
          formattedInstructions = [
            'Juice the lemons to make about 1 cup of juice.',
            'Add the sugar and stir until dissolved in the lemon juice.',
            'Add the water and stir to combine.',
            'Add ice cubes and serve immediately.',
            'Garnish with lemon slices if desired.'
          ];
        } else if (selectedRecipeTitle.toLowerCase().includes('smoothie')) {
          console.log('[DEBUG] Adding default smoothie instructions');
          formattedInstructions = [
            'Add all ingredients to a blender.',
            'Blend until smooth and creamy.',
            'Pour into glasses and serve immediately.'
          ];
        } else if (selectedRecipeTitle.toLowerCase().includes('juice')) {
          console.log('[DEBUG] Adding default juice instructions');
          formattedInstructions = [
            'Wash all produce thoroughly.',
            'Cut ingredients into pieces that will fit your juicer.',
            'Process through a juicer following manufacturer instructions.',
            'Stir and serve immediately over ice if desired.'
          ];
        }
      }
      
      // Determine prepTime, cookTime and servings with fallbacks
      const prepTime = selectedRecipeData?.prepTime || 15;
      const cookTime = selectedRecipeData?.cookTime || 15;
      const totalTime = selectedRecipeData?.totalTime || (prepTime + cookTime);
      const servings = selectedRecipeData?.servings || 2;
      
      // Enhanced nutrition extraction
      let nutritionalInfo = { 
        calories: selectedRecipeData?.calories || 0, 
        protein: selectedRecipeData?.protein || 0, 
        carbs: selectedRecipeData?.carbs || 0, 
        fat: selectedRecipeData?.fat || 0,
        fiber: selectedRecipeData?.fiber || 0
      };
      
      // Special handling for beverages like lemonade if nutrition is missing
      const isBeverage = selectedRecipeTitle.toLowerCase().includes('lemonade') || 
                         selectedRecipeTitle.toLowerCase().includes('juice') || 
                         selectedRecipeTitle.toLowerCase().includes('smoothie') ||
                         selectedRecipeTitle.toLowerCase().includes('drink');
      
      if (isBeverage && (!nutritionalInfo.calories || !nutritionalInfo.carbs)) {
        console.log('[DEBUG] Applying beverage-specific nutrition estimates');
        
        // Default values for common beverages if we can't extract them
        if (selectedRecipeTitle.toLowerCase().includes('lemonade')) {
          // Standard lemonade nutritional values (if not specified)
          if (!nutritionalInfo.calories) nutritionalInfo.calories = 120;
          if (!nutritionalInfo.carbs) nutritionalInfo.carbs = 32;
          if (!nutritionalInfo.protein) nutritionalInfo.protein = 0;
          if (!nutritionalInfo.fat) nutritionalInfo.fat = 0;
          if (!nutritionalInfo.fiber) nutritionalInfo.fiber = 0;
        } else if (selectedRecipeTitle.toLowerCase().includes('smoothie')) {
          // Average smoothie values
          if (!nutritionalInfo.calories) nutritionalInfo.calories = 200;
          if (!nutritionalInfo.carbs) nutritionalInfo.carbs = 40;
          if (!nutritionalInfo.protein) nutritionalInfo.protein = 5;
          if (!nutritionalInfo.fat) nutritionalInfo.fat = 2;
          if (!nutritionalInfo.fiber) nutritionalInfo.fiber = 4;
        } else if (selectedRecipeTitle.toLowerCase().includes('juice')) {
          // Average juice values
          if (!nutritionalInfo.calories) nutritionalInfo.calories = 110;
          if (!nutritionalInfo.carbs) nutritionalInfo.carbs = 26;
          if (!nutritionalInfo.protein) nutritionalInfo.protein = 1;
          if (!nutritionalInfo.fat) nutritionalInfo.fat = 0;
          if (!nutritionalInfo.fiber) nutritionalInfo.fiber = 0;
        }
      }
      
      // If any values are missing, try to extract from raw nutritional info
      if (!nutritionalInfo.calories || !nutritionalInfo.protein || !nutritionalInfo.carbs || !nutritionalInfo.fat) {
        const rawInfo = selectedRecipeData?.rawNutritionalInfo || '';
        const extractedInfo = extractNutritionalInfo(rawInfo);
        
        // Use extracted values if they're not zero
        if (extractedInfo.calories > 0) nutritionalInfo.calories = extractedInfo.calories;
        if (extractedInfo.protein > 0) nutritionalInfo.protein = extractedInfo.protein;
        if (extractedInfo.carbs > 0) nutritionalInfo.carbs = extractedInfo.carbs;
        if (extractedInfo.fat > 0) nutritionalInfo.fat = extractedInfo.fat;
        if (extractedInfo.fiber > 0) nutritionalInfo.fiber = extractedInfo.fiber;
      }
      
      // If still missing values, try to extract from full recipe text
      if (!nutritionalInfo.calories || !nutritionalInfo.protein || !nutritionalInfo.carbs || !nutritionalInfo.fat) {
        const fullText = selectedRecipeData?.fullText || '';
        const extractedInfo = extractNutritionalInfo(fullText);
        
        // Use extracted values if they're not zero
        if (extractedInfo.calories > 0) nutritionalInfo.calories = extractedInfo.calories;
        if (extractedInfo.protein > 0) nutritionalInfo.protein = extractedInfo.protein;
        if (extractedInfo.carbs > 0) nutritionalInfo.carbs = extractedInfo.carbs;
        if (extractedInfo.fat > 0) nutritionalInfo.fat = extractedInfo.fat;
        if (extractedInfo.fiber > 0) nutritionalInfo.fiber = extractedInfo.fiber;
      }
      
      // Create a recipe object with all the extracted information
      const recipe: Recipe = {
        id: selectedRecipe,
        name: selectedRecipeTitle,
        mealType,
        description: "Added from AI recommendation",
        prepTime: prepTime,
        cookTime: cookTime,
        servings: servings,
        nutritionalInfo: nutritionalInfo,
        ingredients: formattedIngredients,
        instructions: formattedInstructions,
        cuisine: "",
        tags: ["ai-recommended"],
        // Remove the raw text properties to prevent duplication
        rawNutritionalInfo: selectedRecipeData?.rawNutritionalInfo || ''
      };
      
      // Always add fullText as the description to keep all information
      if (selectedRecipeData?.fullText) {
        // Use the full recipe text as the description to preserve all information
        recipe.description = "Recipe from AI: " + selectedRecipeData.fullText.substring(0, 300) + 
          (selectedRecipeData.fullText.length > 300 ? "..." : "");
      }
      
      console.log("[DEBUG] Adding complete recipe to store:", recipe);
      setDebugMessage(`Adding recipe: ${recipe.name}`);
      
      // Add to recommended recipes store
      try {
        addRecommendedRecipe(recipe);
        console.log("[DEBUG] Recipe added to recommended recipes");
      } catch (err) {
        console.error("[DEBUG] Error adding to recommended recipes:", err);
      }
      
      // Add to meal plan - assuming day index 0 for now (today)
      try {
        addRecipeToMealPlan(recipe, 0, mealType);
        console.log("[DEBUG] Recipe added to meal plan for day 0 as", mealType);
      } catch (err) {
        console.error("[DEBUG] Error adding to meal plan:", err);
      }
      
      // Close dropdown
      setShowMealTypeDropdown(false);
      setSelectedRecipe(null);
      
      // Navigate to recipes page
      console.log("[DEBUG] Navigating to recipes page");
      router.push('/recipes');
    } catch (err) {
      console.error("[DEBUG] Error in addToMealType:", err);
      setDebugMessage(`Error: ${err instanceof Error ? err.message : String(err)}`);
    }
  };
  
  return (
    <div className="flex flex-col h-full">
      <style jsx>{markdownStyles}</style>
      <style jsx global>{textareaStyles}</style>
      
      {/* Meal type dropdown */}
      {showMealTypeDropdown && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-4">Add Recipe to Collection</h3>
            <p className="mb-4 text-gray-600 dark:text-gray-300">
              What meal type is "{selectedRecipeTitle}"? It will be added to your recipes and meal plan.
            </p>
            {/* Add debug message */}
            {debugMessage && (
              <p className="mb-4 text-xs text-red-500">{debugMessage}</p>
            )}
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => addToMealType('breakfast')}
                className="btn bg-blue-100 hover:bg-blue-200 text-blue-800 dark:bg-blue-900 dark:hover:bg-blue-800 dark:text-blue-100"
              >
                Breakfast
              </button>
              <button 
                onClick={() => addToMealType('lunch')}
                className="btn bg-green-100 hover:bg-green-200 text-green-800 dark:bg-green-900 dark:hover:bg-green-800 dark:text-green-100"
              >
                Lunch
              </button>
              <button 
                onClick={() => addToMealType('dinner')}
                className="btn bg-purple-100 hover:bg-purple-200 text-purple-800 dark:bg-purple-900 dark:hover:bg-purple-800 dark:text-purple-100"
              >
                Dinner
              </button>
              <button 
                onClick={() => addToMealType('snack')}
                className="btn bg-yellow-100 hover:bg-yellow-200 text-yellow-800 dark:bg-yellow-900 dark:hover:bg-yellow-800 dark:text-yellow-100"
              >
                Snack
              </button>
            </div>
            <div className="mt-4 text-right">
              <button 
                onClick={() => setShowMealTypeDropdown(false)}
                className="btn btn-outline"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center">
            <h2 className="text-2xl font-bold text-gray-400 dark:text-gray-500">
              Meal Prep Assistant
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mt-2 text-center max-w-md">
              Ask me about recipes, nutrition, meal planning, or how to use specific ingredients.
            </p>
          </div>
        ) : (
          <div className="flex flex-col space-y-6">
            {messages.map(message => (
              <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {message.role === 'user' ? (
                  <div className="bg-blue-600 text-white rounded-2xl rounded-br-none py-2 px-4 max-w-[80%] shadow">
                    {message.content}
                  </div>
                ) : (
                  <div className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-2xl rounded-bl-none py-3 px-4 max-w-[90%] shadow overflow-hidden">
                    <div className="markdown-content overflow-hidden">
                      <ReactMarkdown>
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-2xl rounded-bl-none py-3 px-4 shadow">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
      
      <div className="border-t border-gray-200 dark:border-gray-700 p-4">
        <form onSubmit={handleSubmit} className="flex items-end space-x-2">
          <div className="relative flex-grow">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about meal planning, recipes, nutrition..."
              className="w-full resize-none overflow-hidden py-3 px-4 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[40px] max-h-[200px]"
              rows={1}
            />
            <button 
              type="submit" 
              className="absolute right-2 bottom-2 p-2 rounded-full text-blue-500 hover:bg-blue-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading || !input.trim()}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          
          {/* Add to recipe button */}
          <button 
            type="button"
            onClick={() => {
              if (activeChat && activeChat.messages.length > 0) {
                const lastAssistantMessage = [...activeChat.messages]
                  .reverse()
                  .find(msg => msg.role === 'assistant');
                
                if (lastAssistantMessage) {
                  const recipeId = `recipe-${Date.now()}`;
                  const recipeTitle = "Recipe from chat";
                  
                  handleAddRecipe(recipeId, recipeTitle, {
                    id: recipeId,
                    title: recipeTitle,
                    fullText: lastAssistantMessage.content
                  });
                }
              }
            }}
            className="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-md flex-shrink-0"
          >
            Add to recipe
          </button>
        </form>
        {error && (
          <p className="text-red-500 mt-2 text-sm">{error}</p>
        )}
      </div>
    </div>
  );
} 