# DiveLogger Template Organization

## Directory Structure

- **auth/**: Authentication-related templates (login, register, profile, etc.)
- **components/**: Reusable components that can be included in multiple templates
- **dive_logs/**: Templates related to dive logging functionality
  - **partials/**: Partial templates for form sections and reusable dive log components
- **errors/**: Error page templates
- **shared/**: Templates for shared dive functionality

## Component Usage

### Dive Card Component

The `components/dive_card.html` file contains a reusable macro for displaying dive cards:

```jinja
{% from "components/dive_card.html" import dive_card %}

{{ dive_card(dive, shared_by=None, token=None, shared_date=None) }}
```

### Search Component

The `components/search.html` file contains reusable macros for search functionality:

```jinja
{% from "components/search.html" import search_form, search_css, search_js %}

{# Include search CSS in the styles block #}
{% block styles %}
{{ search_css() }}
{% endblock %}

{# Include search form in the content block #}
{% block content %}
{{ search_form(
    placeholder="Search...", 
    id_prefix="search",
    item_selector=".item", 
    search_fields=[".item-title", ".item-description"]
) }}
{% endblock %}

{# Include search JavaScript in the scripts block #}
{% block scripts %}
{{ search_js() }}
{% endblock %}
```

The search component uses external CSS and JavaScript files to avoid inline styles and scripts:
- `app/static/css/search.css`: Contains all the search styling
- `app/static/js/search.js`: Contains the search functionality logic

The parameters for the search_form macro are:
- `placeholder`: Text placeholder for the search input
- `id_prefix`: Prefix for the search input and button IDs
- `item_selector`: CSS selector for the items to search through
- `search_fields`: Array of CSS selectors for fields to search within each item

This approach improves code maintainability and eliminates linter warnings.

## Form Organization

The dive log form is split into logical sections:

1. `dive_form_information.html`: Basic dive information
2. `dive_form_details.html`: Dive details like time, depth, visibility
3. `dive_form_equipment.html`: Equipment used during the dive
4. `dive_form_buddies.html`: Dive buddy information
5. `dive_form_species.html`: Species sightings
6. `dive_form_notes_media.html`: Notes and media uploads
7. `dive_form_import.html`: Dive computer data import

## Migration Notes

If you're updating from the old template structure, make sure to:

1. Update route references in Flask to point to the new template locations
2. Test all functionality after migration
3. Remove the old template files once everything is working correctly 