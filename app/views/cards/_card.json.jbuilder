json.extract! card, :id, :name, :content, :list_id, :created_at, :updated_at
json.url card_url(card, format: :json)
