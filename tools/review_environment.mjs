/** Child-process environment for offline review; never enables provider calls. */
export function reviewEnvironment(source=process.env){
 const env={...source,MUSEUM_AI_ENABLED:'0',RACE_ENGINEER_AI_ENABLED:'0'};
 delete env.GROQ_API_KEY;delete env.OPENAI_API_KEY;
 return env;
}
