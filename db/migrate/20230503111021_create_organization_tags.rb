class CreateOrganizationTags < ActiveRecord::Migration[7.0]
  def change
    create_table :organization_tags do |t|
      t.references :organization, null: false, foreign_key: true
      t.references :tag, null: false, foreign_key: true

      t.timestamps
    end
  end
end
