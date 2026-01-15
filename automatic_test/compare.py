import pandas as pd


def compare_csv(file1, file2):
    # Read the CSV files
    df1 = pd.read_csv(file1)
    df2 = pd.read_csv(file2)

    # Get the common columns
    common_columns = df1.columns.intersection(df2.columns)

    # For each column name, get the 2 columns from the 2 dataframes and export the ratio of values in the 2nd column that is >= value in the 1st column
    for column in common_columns:
        # Get the 2 columns from the 2 dataframes
        col1 = df1[column]
        col2 = df2[column]

        # Calculate the ratio of values in the 2nd column that is >= value in the 1st column
        ratio_greater = (col2 > col1).mean()
        ratio_equal = (col2 == col1).mean()
        ratio_lower = (col2 < col1).mean()

        # Print the result
        print(f"Ratio of values in {file2} that are > values in {file1} for column '{column}': {ratio_greater:.2%}")
        print(f"Ratio of values in {file2} that are = values in {file1} for column '{column}': {ratio_equal:.2%}")
        print(f"Ratio of values in {file2} that are < values in {file1} for column '{column}': {ratio_lower:.2%}")
        print()

    


if __name__ == "__main__":
    FILE_1 = "eval_reciprocal_no_act.csv"
    FILE_2 = "eval_reciprocal_act_0.2.csv"
    OUTPUT_FILE = "joined_results_1_2.csv"

    # compare_csv(FILE_1, FILE_2)

    df_1 = pd.read_csv(FILE_1)
    # df_1.set_index(["query_id", "k"], inplace=True)
    df_1.set_index(["query_id"], inplace=True)

    df_2 = pd.read_csv(FILE_2)
    # df_2.set_index(["query_id", "k"], inplace=True)
    df_2.set_index(["query_id"], inplace=True)

    # Join the two dataframes on the index
    df_joined = df_1.join(df_2, lsuffix="_file1", rsuffix="_file2", how="outer")

    df_joined['activity worse'] = df_joined['rank_of_1st_hit_file1'] < df_joined['rank_of_1st_hit_file2']

    df_joined.to_csv(OUTPUT_FILE, index=True)