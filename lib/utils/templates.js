// Template variable replacement utilities
export function renderTemplate(template, variables) {
  let rendered = template
  
  // Replace template variables like {{variable_name}}
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g')
    rendered = rendered.replace(regex, value || '')
  })
  
  return rendered
}

export function getTemplateVariables(template) {
  const regex = /{{\\s*([^}]+)\\s*}}/g
  const variables = []
  let match
  
  while ((match = regex.exec(template)) !== null) {
    variables.push(match[1].trim())
  }
  
  return [...new Set(variables)] // Remove duplicates
}

export function getEventVariables(event, guest = null) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || ''; // defina no .env, ex: https://app.seudominio.com
  const variables = {
    event_title: event.title,
    event_description: event.description || '',
    location: event.location || '',
    starts_at: new Date(event.starts_at).toLocaleString(),
    ends_at: event.ends_at ? new Date(event.ends_at).toLocaleString() : '',
    rsvp_link: event.rsvp_token
      ? `${baseUrl}/public/rsvp/${event.rsvp_token}`
      : ''
  };

  if (guest) {
    variables.name = guest.name;
    variables.email = guest.email || '';
    variables.phone = guest.phone_e164 || '';
    variables.tag = guest.tag || '';
  }

  return variables;
}
