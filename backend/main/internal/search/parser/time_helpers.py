import setup
import re
from internal.search.parser import constants

def date_to_int(year, month, day):
    return year * 10000 + month * 100 + day

def find_year(date_text: str) -> int:
    # Sử dụng regex để tìm số đầu tiên có dạng "20xx"
    pattern = r"20\d{2}"
    match = re.search(pattern, date_text)
    if match:
        return int(match.group())
    else:
        return -1

def find_month(date_text: str) -> int:
    date_text = date_text.lower()
    for key in constants.month_list:
        if key in date_text:
            return constants.month_list[key]
    return -1

def find_day(date_text: str) -> int:
    # find in stored list
    for key in constants.day_list:
        if key in date_text:
            return constants.day_list[key]
    # if cannot find, try regex
    pattern = r"(?<![0-9])([1-9]|[12][0-9]|3[01])(?![0-9])(?!\s)"
    match = re.search(pattern, date_text)
    if match:
        return int(match.group())
    else:
        return -1

def find_date_by_season(year: int, date_text: str) -> tuple[int, int]:
    # find season name in the text
    season_name = ""
    for name in constants.season_list:
        pattern = r"\b{}\b".format(name)
        if re.search(pattern, date_text, re.IGNORECASE):
            season_name = name
            break
    # if cannot find season name, return -1
    if season_name == "":
        return -1, -1
    # find begin and end date of the season
    begin_month = constants.season_list[season_name]["begin_month"]
    begin_day = constants.season_list[season_name]["begin_day"]
    end_month = constants.season_list[season_name]["end_month"]
    end_day = constants.season_list[season_name]["end_day"]
    # return the date
    if season_name == "winter":
        return date_to_int(year, begin_month, begin_day), date_to_int(year + 1, end_month, end_day)
    return date_to_int(year, begin_month, begin_day), date_to_int(year, end_month, end_day)

def find_date(date_text: str) -> int:
    # find year, month, day as regular
    year = find_year(date_text)
    month = find_month(date_text)
    day = find_day(date_text)
    if year == -1:                                                          # if cannot find year, return -1
        return -1, -1
    if month != -1 and day != -1:                                           # if find year plus both month and day, return the date
        return date_to_int(year, month, day), -1
    if month != -1:                                                         # if find year plus only month, return the month period
        return date_to_int(year, month, 1), date_to_int(year, month, 31)
    # if find year but cannot find month, try to find season
    date_by_season = find_date_by_season(year, date_text)
    if date_by_season != (-1, -1):                                          # if find year plus season, return the season period
        return date_by_season
    # if find year only, find by season but failed -> return the whole year
    return date_to_int(year, 1, 1), date_to_int(year, 12, 31)               
    
# ----------------------------------------------------------------------------------------------------------

def time_to_int(hour, minute):
    return hour * 100 + minute

def difference_of_time(time_range_candidate) -> int:
    time1 = time_range_candidate[0]
    time2 = time_range_candidate[1]
    return time2 - time1 - 40 * (time2 // 100 - time1 // 100)

def find_time_relative(time_entity: str) -> tuple[int, int]:
    for time in constants.time_of_the_day:
        if time.lower() in time_entity.lower():
            begin_hour = constants.time_of_the_day[time]["begin_hour"]
            begin_min = constants.time_of_the_day[time]["begin_min"]
            end_hour = constants.time_of_the_day[time]["end_hour"]
            end_min = constants.time_of_the_day[time]["end_min"]
            return time_to_int(begin_hour, begin_min), time_to_int(end_hour, end_min)
    return -1, -1

def find_time_absolute(time_entity: str) -> tuple[int, int]:
    time_pattern = r'\b(\d{1,2}):(\d{2})\b'
    am_pm_pattern = r'\b(\d{1,2})\s?(a\.?m\.?|p\.?m\.?)\b'

    time_match = re.search(time_pattern, time_entity)
    am_pm_match = re.search(am_pm_pattern, time_entity)

    if time_match:
        hour = int(time_match.group(1))
        minute = int(time_match.group(2))
        return time_to_int(hour - 1, minute), time_to_int(hour + 1, minute)

    if am_pm_match:
        hour = int(am_pm_match.group(1))
        am_pm = am_pm_match.group(2).lower()

        if am_pm == 'a.m' or am_pm == 'am':
            return time_to_int(hour - 1, 0), time_to_int(hour + 1, 0)
        elif am_pm == 'p.m' or am_pm == 'pm':
            hour = (hour + 12) % 24
            return time_to_int((hour - 1) % 24, 0), time_to_int((hour + 1) % 24, 0)
        
    return -1, -1

def find_time(time_entities: list) -> tuple[int, int]:
    time_range_candidates = []
    for time_entity in time_entities:
        time_relative = find_time_relative(time_entity)                     # theo buổi 
        if time_relative != (-1, -1):
            time_range_candidates.append(time_relative)
        time_absolute = find_time_absolute(time_entity)                     # theo giờ cụ thể
        if time_absolute != (-1, -1):
            time_range_candidates.append(time_absolute)         
    if len(time_range_candidates) == 0:
        return -1, -1
    # chọn ra 1 cặp thời gian tốt nhất
    return min(time_range_candidates, key=lambda candidate: difference_of_time(candidate))

# ----------------------------------------------------------------------------------------------------------

def extract_date_time_entities(text_query: str) -> tuple[list[str], list[str]]:
    doc = setup.nlp(text_query)
    date_entities = []
    time_entities = []
    for ent in doc.ents:
        if ent.label_ == "DATE":
            date_entities.append(ent.text.strip())
        elif ent.label_ == "TIME":
            time_entities.append(ent.text.strip())
    return date_entities, time_entities

# ----------------------------------------------------------------------------------------------------------

# fill date and time if not found
def fill_date_time(date1, time1, date2, time2):

    # date_boost and time_boost are config for weight of datetime in the whole ElasticSearch query
    # the larger boost is the more important datetime is
    date_boost = 100
    time_boost = 100
    if date1 == -1:
        date1 = 20190101
        date2 = 20200630
        date_boost = 0.1
    elif date2 == -1:
        date2 = date1
    if time1 == -1:
        time1 = 0
        time2 = 2359
        time_boost = 0.1
    
    # return
    print("Datetime filled: ", date1, time1, date2, time2)
    return date1, time1, date2, time2, date_boost, time_boost