import pandas as pd

input_file = 'LHE_keyframe_to_time_mapping.csv'

# Load the data from the input file
df = pd.read_csv(input_file)

# Dynamically add the 'frame' column by grouping by 'video_id'
df['frame'] = df.groupby('video_id').cumcount() + 1

# Save the updated DataFrame to a new CSV file
output_file = 'LHE_keyframe_to_time_mapping_transformed.csv'
df.to_csv(output_file, index=False)