Rails.application.routes.draw do
  resources :boards
  resources :cards
  resources :lists
  delete 'settings/reset_app'
  root to: 'lists#index'
  # For details on the DSL available within this file, see http://guides.rubyonrails.org/routing.html
end
