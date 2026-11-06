export const DAILY_MESSAGES = [
  "Tu yo de mañana te lo agradecerá.",
  "Una tarea a la vez. Eso es todo.",
  "No lo dejes para mañana lo que puedes terminar hoy.",
  "Cada tarea completada es un paso adelante.",
  "La constancia vence al talento.",
  "Pequeños pasos todos los días.",
  "Tú puedes con esto y más.",
  "Hazlo ahora, el futuro te lo agradecerá.",
  "El éxito es la suma de pequeños esfuerzos repetidos día tras día.",
  "No te detengas hasta que te sientas orgulloso.",
  "Disciplina es elegir entre lo que quieres ahora y lo que más quieres.",
  "El mejor momento para empezar fue ayer. El segundo mejor momento es ahora.",
  "No cuentes los días, haz que los días cuenten.",
  "La motivación te hace empezar, el hábito te hace continuar.",
  "Si quieres resultados diferentes, no hagas siempre lo mismo.",
  "Cree en ti mismo y todo será posible.",
  "La única forma de hacer un gran trabajo es amar lo que haces.",
  "Haz de cada día tu obra maestra.",
  "El fracaso es solo la oportunidad de comenzar de nuevo, esta vez de forma más inteligente.",
  "No hay atajos para llegar a los lugares que realmente valen la pena.",
  "La acción es la clave fundamental de todo éxito.",
  "Empieza donde estás. Usa lo que tienes. Haz lo que puedes.",
  "A veces, el paso más pequeño en la dirección correcta termina siendo el paso más grande de tu vida.",
  "La diferencia entre lo imposible y lo posible depende de la voluntad de un hombre.",
  "No te limites. Puedes ir tan lejos como tu mente te lo permita.",
  "Lo que haces hoy puede mejorar todas tus mañanas.",
  "Concéntrate en hacia dónde vas, no en lo que dejas atrás.",
  "El optimismo es la fe que conduce al logro. Nada puede hacerse sin esperanza y confianza.",
  "Si puedes soñarlo, puedes hacerlo.",
  "Tu tiempo es limitado, así que no lo desperdicies viviendo la vida de alguien más.",
  "Haz algo hoy que tu futuro yo te agradezca."
];

export function getDailyMessage(): string {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / 86400000);
  const index = dayOfYear % DAILY_MESSAGES.length;
  return DAILY_MESSAGES[index];
}
