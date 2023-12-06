"use client";

import { useState } from "react";

export default function Home() {
  const [streamedData, setStreamedData] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [userPrompt, setUserPrompt] = useState("");

  // Function to convert delimiters into HTML tags in the streamed data
  const convertDelimitersToHTML = (data) => {
    return data.replace(/\|\{/g, '<p className="choiceBox">').replace(/\}\|/g, '</p>');
  };

  const handleChatSubmit = async (e) => {
    e.preventDefault();
    setIsGenerating(true);

    // Construct the fullPrompt using userPrompt state
    const fullPrompt = `You are a code writer tasked to generate an HTML worksheet with embedded CSS. Your sole purpose is to write clean, functional code without any comments, explanations, or unnecessary labels. You are not to engage in conversation or provide meta-comments.

    2. The text must always be black. Do not change the font.
    3. Do not style the body. Do not change any fonts.
    4. Each question must be placed in a question box. Give it the .questionBox class. Do not style the questionBox class.
    5. Each of the choices must be placed under their respective questions. Give the <p> tags the .choiceBox class. Do not style the choiceBox class.
    6. The answer must be placed in a div box under their respective choices. It's class name is "answerBox". DO NOT STYLE THE ANSWERBOX.
    7. Do not put shadows.
    8. Complete any incomplete questions if they lack choices or answer.
    9. EACH QUESTION MUST BE NUMBERED.
    10. LIMIT THE QUESTIONS TO 10 ONLY.
    11. EACH QUESTION MUST HAVE 4 CHOICES.
    
    User-Specific Instructions:
    ${userPrompt}
    
    Generate the worksheet code immediately below this line. Do not include any other information, and do not speak. DO NOT ENCLOSE THE CODE WITHIN ANYTHING, INCLUDING BACKTICKS OR QUOTATIONS.
    `;
    try {
      const response = await fetch("api/chat", {
        method: "POST",
        body: JSON.stringify({ prompt: fullPrompt }),
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body.getReader();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        const processedChunk = convertDelimitersToHTML(chunk);
        setStreamedData((prevData) => prevData + processedChunk);
      }

    } catch (error) {
      console.error("Fetching error:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleInputChange = (e) => {
    setUserPrompt(e.target.value);
  };



    // Function to handle inserting random example text
const handleExampleText = () => {
  const examplePrompts = [
    `The Fascinating World of Honeybees

    Honeybees are one of the most industrious and fascinating insects known to humanity. They belong to the genus Apis, primarily distinguished by their production of honey and construction of perennial, colonial nests from wax. A honeybee's society is incredibly structured, with a single queen, many sterile females known as workers, and some male drones. The queen's sole purpose is to lay eggs, while the workers maintain the hive, collect pollen and nectar, and care for the larvae.
    
    A lesser-known fact about honeybees is their communication skills. They perform a "waggle dance" to inform their hive mates about the direction and distance of a food source. The dance involves a series of movements in a figure-eight pattern, with the angle from the sun indicating direction and the duration of the waggle phase indicating distance.
    
    Honey has been harvested by humans for thousands of years, and the practice of beekeeping has a rich history. In ancient Egypt, honey was not only a food source but also used in creating cement and dressings for wounds. Today, beekeeping is a full-fledged industry, providing products such as honey, beeswax, pollen, royal jelly, and propolis, which are used in various food, cosmetic, and pharmaceutical products.
    
    The environmental impact of honeybees is profound. They are pollinators, playing a crucial role in the biodiversity of plant life and the production of fruits and vegetables. Without them, many of the foods we take for granted would become scarce. It's estimated that a third of the food we consume relies on pollination mainly by bees.
    
    Unfortunately, honeybees face numerous threats, such as habitat loss, pesticides, diseases, and climate change. The phenomenon known as Colony Collapse Disorder (CCD), where worker bees abruptly disappear, has been causing alarm worldwide. Protecting these creatures is not just a matter of biodiversity but also food security for humans.
    
    In recent years, there has been a surge in urban beekeeping as a way to support honeybee populations and educate people about their importance. These efforts, combined with policy changes and increased research into the stressors affecting honeybees, provide hope for their future.`,
    `Digital marketing has revolutionized how businesses interact with consumers, offering a dynamic and interactive platform to engage with a target audience in real-time. The core of digital marketing revolves around the utilization of digital channels such as search engines, social media, email, and websites to connect with prospective customers.

    The essence of digital marketing lies in its ability to quantify results rapidly and accurately. Unlike traditional marketing methods, digital campaigns can be tracked and analyzed through a plethora of analytical tools. These tools allow marketers to gain insights into user behavior, preferences, and patterns, facilitating data-driven strategies to enhance campaign effectiveness.
    
    One of the most powerful aspects of digital marketing is Search Engine Optimization (SEO), which optimizes a website to rank higher in search engine results, thereby increasing organic traffic. Content marketing, a strategic approach focused on creating and distributing valuable, relevant, and consistent content, aims to attract and retain a clearly-defined audience. Social media marketing leverages platforms like Facebook, Twitter, and Instagram to promote brands, products, or services, engaging with the audience through shareable content.
    
    Email marketing, often considered one of the most effective digital marketing strategies, involves sending emails to prospects and customers. Effective marketing emails convert prospects into customers and turn one-time buyers into loyal fans. Moreover, Pay-Per-Click (PPC) advertising enables marketers to pay for top positions on search engines and appear on relevant partner websites, driving traffic to their site.
    
    Digital marketing's true power lies in its adaptability and scalability, making it suitable for businesses of all sizes. From startups to multinational corporations, digital marketing strategies can be tailored to fit the budget and reach of any organization.
    
    In today's digital age, businesses cannot afford to ignore the significance of digital marketing. It's not just a trend but a proven marketing technique that can maximize business potential and growth. As technology evolves, so do the opportunities for digital marketing, making it an exciting and essential field for businesses looking to thrive in the modern marketplace.`,
    `The advent of artificial intelligence (AI) has brought profound changes to the employment landscape, reshaping the future of work and stirring both optimism and concern among economists, technologists, and the workforce. AI's capacity to automate complex tasks, analyze large data sets, and make decisions without human intervention presents both opportunities and challenges for employment.

    AI's most significant impact on employment is automation. Machine learning algorithms and robotic process automation can perform repetitive tasks more efficiently than humans, from data entry and analysis to manufacturing processes. This automation can lead to job displacement, particularly in industries reliant on routine tasks. However, it also opens doors for new job creation in AI development, maintenance, and oversight, fostering a demand for a skilled workforce proficient in technology and data analysis.
    
    In the service sector, AI-driven chatbots and virtual assistants have revolutionized customer service by providing 24/7 assistance. While this may reduce the number of traditional customer service roles, it also emphasizes the need for human employees capable of handling more complex inquiries and providing a personal touch that AI cannot replicate.
    
    The influence of AI extends beyond mere job replacement, as it can augment human capabilities and productivity. AI can assist professionals in various fields, such as healthcare, by analyzing medical data to diagnose diseases faster and more accurately than before, thus enhancing the quality of patient care.
    
    The educational sector also stands to benefit from AI through personalized learning. AI can adapt to individual student needs, providing tailored resources and feedback, thereby supporting teachers and contributing to more effective learning outcomes.
    
    One of the most crucial conversations surrounding AI and employment is the need for reskilling and upskilling the existing workforce to navigate the AI-driven economy. There is a growing emphasis on lifelong learning and the continuous development of skills to remain relevant in an evolving job market.
    
    In conclusion, while AI may pose a risk to certain jobs, it also propels the creation of new roles and industries, calling for a collaborative approach to leverage AI's potential responsibly. By embracing AI as a tool for augmentation rather than replacement, the future workforce can harness its benefits to create a more efficient, innovative, and inclusive job market.`,
    `The Quantum Computing Revolution and Its Potential

    Quantum computing represents a leap forward in computational capability, with the potential to solve complex problems that are currently intractable for classical computers. At the heart of this revolution is the exploitation of quantum mechanics, a fundamental theory in physics that describes nature at the smallest scales of energy levels of atoms and subatomic particles.
    
    Traditional computers use bits as the basic unit of information, which can exist in one of two states: a 0 or a 1. Quantum computers, however, use quantum bits, or qubits, which can be in a state of 0, 1, or any quantum superposition of these states. This property, along with entanglement and interference, allows quantum computers to process a massive number of possibilities simultaneously.
    
    One of the most exciting applications of quantum computing is in the field of cryptography. Quantum computers have the potential to break many of the cryptographic systems currently in use, which rely on the difficulty of factoring large numbers—a task quantum computers could perform exceedingly well. Conversely, quantum cryptography could allow us to create theoretically unbreakable encryption methods.
    
    In drug discovery and material science, quantum computers could model molecular structures and interactions at an atomic level with unprecedented accuracy. This capability could lead to the development of new medications, superconductors, or energy storage solutions, accelerating innovation that could take decades with classical computing methods.
    
    However, the science of quantum computing is incredibly complex, involving delicate manipulations of quantum states. Quantum coherence and quantum error correction are significant challenges, as qubits are extremely sensitive to external disturbances, which can lead to decoherence and loss of information. Developing algorithms that can tolerate or correct such errors is a critical area of research.
    
    Despite these challenges, the theoretical and potential practical benefits of quantum computing continue to drive investment and research in the field. As we learn to harness the peculiarities of quantum mechanics, quantum computing stands poised to redefine what is computationally possible, potentially transforming science, industry, and society at large.`,
    `
    The Solar System: An Overview of Our Cosmic Neighborhood
    
    Our solar system is a celestial mechanism of planets, moons, asteroids, comets, and other space objects orbiting our star, the Sun. It was formed approximately 4.6 billion years ago from the gravitational collapse of a giant interstellar molecular cloud. The center of this system, the Sun, holds about 99.86% of the system's mass and provides the gravitational pull that binds the system together.
    
    Eight planets follow elliptical orbits around the Sun, divided into two categories: the four inner terrestrial planets (Mercury, Venus, Earth, and Mars) and the four outer gas giants (Jupiter, Saturn, Uranus, and Neptune). These planets are accompanied by a host of moons, with Earth having one, Mars two, and the gas giants boasting numerous moons in complex orbital dances.
    
    The terrestrial planets are composed primarily of rock and metal, and have relatively high densities, slow rotation, solid surfaces, no rings, and few moons. In contrast, the gas giants have thick atmospheres, ring systems, numerous moons, and faster rotation periods.
    
    Beyond Neptune lies the Kuiper Belt, a vast ring of frozen objects, where the dwarf planet Pluto resides along with other icy bodies. Even further are the scattered disc and the hypothetical Oort Cloud, which are thought to be sources of short-period and long-period comets, respectively, that visit the Sun's vicinity.
    
    The solar system also contains regions populated by smaller objects. The asteroid belt, located between the orbits of Mars and Jupiter, contains millions of rocky bodies and is thought to be remnants from the solar system's formation that never coalesced into a planet. Similarly, comets are icy remnants from the solar system's outer reaches that display spectacular tails when their orbits bring them close to the Sun.
    
    Understanding the solar system has deep implications for our understanding of the origins of life and the development of planetary systems. It's a fundamental step in grasping our place in the universe and provides context for the search for extraterrestrial life and the exploration of potentially habitable worlds beyond our own. With ongoing missions and telescopic advancements, our knowledge of the solar system continues to expand, revealing more about the complex and beautiful orchestra of celestial bodies dancing around our star.`
    // Add more example prompts as needed
  ];
  // Randomly select a prompt
  const randomIndex = Math.floor(Math.random() * examplePrompts.length);
  const randomExampleText = examplePrompts[randomIndex];
  setUserPrompt(randomExampleText);
};


  
return (
  <main className="bg-white min-h-screen p-4">
    <div className="w-full max-w-4xl mx-auto">
      <div className="text-center mb-4"> {/* Remove fixed positioning and add margin-bottom */}
        <h1 className="text-5xl main-title">The Self-Quiz Engine</h1>
        <p className="text-xl">by David Castro</p>
      </div>
      {!streamedData && (
        <div className="mt-8"> {/* Add margin-top for spacing */}
          <form onSubmit={handleChatSubmit} className="flex flex-col gap-4">
            <textarea
              className="textarea"
              placeholder="Paste your story/essay/report here and the AI will convert it into a self-study quiz."
              value={userPrompt}
              onChange={handleInputChange}
              rows="6"
              maxLength="14000"
              disabled={isGenerating}
            />
        <button
          onClick={handleExampleText}
          className="use-example-button"
          disabled={isGenerating}
        >
          Use Example
        </button>
            <div className="flex justify-between items-center">
              <div className="character-count">
                {userPrompt.length}/14000
              </div>
              <button
                type="submit"
                className="px-6 py-2 bg-black text-white rounded-md hover:bg-gray-700 transition-colors disabled:bg-gray-400"
                disabled={isGenerating}
              >
                {isGenerating ? "Generating..." : "Generate"}
              </button>
            </div>
          </form>
        </div>
      )}

{streamedData && (
  <div style={{ paddingBottom: '100px' }}> {/* Inline style to add padding at the bottom */}
    <div dangerouslySetInnerHTML={{__html: streamedData}}></div>
  </div>
)}
    </div>

    {streamedData && (
  <div className="fixed inset-x-0 bottom-0 mx-auto w-full max-w-4xl px-4 bg-white">
    <form onSubmit={handleChatSubmit} className="flex justify-between items-center p-4 border-t-2 border-gray-300">
      <input
        type="text"
        className="w-full p-4 text-lg border-2 border-gray-300 rounded-lg focus:outline-none"
        placeholder="Type your message..."
        value={userPrompt}
        onChange={handleInputChange}
        disabled={isGenerating}
      />
      <button
        type="submit"
        className="ml-4 px-6 py-2 bg-black text-white rounded-md hover:bg-gray-700 transition-colors disabled:bg-gray-400"
        disabled={isGenerating}
      >
        {isGenerating ? "Sending..." : "Send"}
      </button>
    </form>
  </div>
)}
  </main>
);

}