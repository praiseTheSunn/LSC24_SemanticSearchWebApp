import spacy
import re
import datetime
from collections import OrderedDict
import calendar
import numpy as np
from helper import setup
nlp = spacy.load('en_core_web_sm')

def date_to_str(datetime_obj):
    year = str(datetime_obj.year)
    month = str(datetime_obj.month).zfill(2)
    day = str(datetime_obj.day).zfill(2)
    return year + month + day

def extract_date_entities(sentence):
    """Extract named entities from a given sentence and return them in a list of tuples."""
    doc = nlp(sentence)
    entities = []
    for ent in doc.ents:
        # entities.append([ent.text.strip(), ent.label_])
        if ent.label_ == "DATE":
            entities.append(ent.text.strip())
    return entities

def string_combination(list):
    s = ""
    for text in list:
        s = s + text + " "
    return s

def normalize_text_date(text):
    text_entities = extract_date_entities(text)
    if len(text_entities) < 0:
        return False
    return string_combination(extract_date_entities(text))

def findYear(text):
    # Sử dụng regex để tìm số đầu tiên có dạng "20xx"
    pattern = r"20\d{2}"
    match = re.search(pattern, text)
    if match:
        return match.group()
    else:
        return None

def findDayRegex(text):
    # Sử dụng regex để tìm ngày trong range từ 1-31
    pattern = r"(?<![0-9])([1-9]|[12][0-9]|3[01])(?![0-9])(?!\s)"
    match = re.search(pattern, text)

    if match:
        return match.group()
    else:
        return None

    from collections import OrderedDict
day_list = {}

for day in range(1, 32):
    if day == 1 or day == 21 or day == 31:
        day_str = str(day) + "st"
    elif day == 2 or day == 22:
        day_str = str(day) + "nd"
    elif day == 3 or day == 23:
        day_str = str(day) + "rd"
    else:
        day_str = str(day) + "th"

    day_list[day_str] = f"{day:02d}"
day_list = OrderedDict(reversed(list(day_list.items())))

def findDayInDayList(text):
    for key in day_list:
        if key in text:
            return day_list[key]
    return None

def findDay(text):
    day = findDayInDayList(text)
    if day is not None:
        return day
    else:
        return findDayRegex(text)

month_list = {
    "January": "01",
    "February": "02",
    "March": "03",
    "April": "04",
    "May": "05",
    "June": "06",
    "July": "07",
    "August": "08",
    "September": "09",
    "October": "10",
    "November": "11",
    "December": "12",
    "Jan": "01",
    "Feb": "02",
    "Mar": "03",
    "Apr": "04",
    "Aug": "08",
    "Sep": "09",
    "Oct": "10",
    "Nov": "11",
    "Dec": "12"
}

def findMonth(text):
    for key in month_list:
        if key in text:
            return month_list[key]
    return None

def isDate(text):
    year = findYear(text)
    month = findMonth(text)
    day = findDay(text)

    if day is None and month is None and year is None:
        return False
    return True
def isPerfectDate(year, month, day):
  # year = findYear(text)
  # month = findMonth(text)
  # day = findDay(text)

  if day is not None and month is not None and year is not None:
    return True
  return False
def get_month_period(year, month):
    year = int(year)
    month = int(month)
    _, last_day = calendar.monthrange(year, month)
    begin = datetime.date(year, month, 1)
    end = datetime.date(year, month, last_day)
    period = [begin, end]
    return period
def findDate(text):
    if isDate(text) == False:
        return False
    year = findYear(text)
    month = findMonth(text)
    day = findDay(text)

    if isPerfectDate(year, month, day):
        date = datetime.datetime(year=int(year), month=int(month), day=int(day))
        return date.date()
    if year == None:
        return False
    if day is None:
        if month is not None:
            return get_month_period(year, month)
    else:
        begin = datetime.date(int(year), 1, 1)
        end = datetime.date(int(year), 12, 31)
        period = [begin, end]
        return period
    
season_list = {
    "spring": {
        "begin_day": "01",
        "begin_month": "03",
        "end_day": "31",
        "end_month": "05"
    },
    "summer": {
        "begin_day": "01",
        "begin_month": "06",
        "end_day": "31",
        "end_month": "08"
    },
    "autumn": {
        "begin_day": "01",
        "begin_month": "09",
        "end_day": "30",
        "end_month": "11"
    },
    "winter": {
        "begin_day": "01",
        "begin_month": "12",
        "end_date": "28",
        "end_month": "02"
    }
}

# Mùa xuân bắt đầu từ tháng 3 – và kết thúc tháng 5
# Mùa hè hay còn gọi là mùa hạ bắt đầu từ tháng 6 –  kết thúc tháng 8
# Mùa thu sẽ bặt đầu từ tháng 9 – kết thúc tháng 11
# Mùa đông sẽ bắt đầu từ tháng 12 – kết thúc tháng 2

def findSeason(text):
    for season_name, season_dates in season_list.items():
        pattern = r"\b{}\b".format(season_name)
        if re.search(pattern, text, re.IGNORECASE):
            return season_name
    return None

def findSeasonPeriod(text):
    season = findSeason(text)
    if season is None:
        return None

    year = findYear(text)
    print("year", year)
    if year is None:
        return None
    begin_month = int(season_list[season]["begin_month"])
    begin_day = int(season_list[season]["begin_day"])
    end_month = int(season_list[season]["end_month"])
    end_day = int(season_list[season]["end_day"])
    
    if season == "winter":
        begin_date = datetime.date(int(year), begin_month, begin_day)
        end_date = datetime.date(int(year + 1), end_month, end_day)        
    else:
        begin_date = datetime.date(int(year), begin_month, begin_day)
        end_date = datetime.date(int(year), end_month, end_day)

    return [begin_date, end_date]

def findDayOfWeek(period, target_day):
    if not isinstance(period, list):
        return False

    if len(period) != 2:
        return False

    if target_day is None:
        return False

    start_date = period[0]
    end_date = period[1]

    if not isinstance(start_date, datetime.date) or not isinstance(end_date, datetime.date):
        return False

    days = {}
    current_date = start_date
    day_to_find = target_day.lower()

    # Xác định ngày đầu tiên trong khoảng thời gian
    while current_date <= end_date:
        if current_date.strftime('%A').lower() == day_to_find:
            days[date_to_str(current_date)] = True  # Thêm ngày vào từ điển
#             days.append(current_date)
        current_date += datetime.timedelta(days=1)  # Tăng ngày lên 1 ngày

    return days
target_day_list = {
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday"
}

def findDaysOfWeekFromText(text):
    for target_day in target_day_list:
        if re.search(r"\b" + target_day + r"\b", text, re.IGNORECASE):
            # print(target_day)
            return target_day
    return None

def compare_date_ranges(find_date, find_season):
    if isinstance(find_date, list) and not isinstance(find_season, list):
        return find_date
    if not isinstance(find_date, list) and isinstance(find_season, list):
        return find_season
    if not isinstance(find_date, list) and not isinstance(find_season, list):
        return None

    if len(find_date) != 2 or len(find_season) != 2:
        return None

    start_date_1, end_date_1 = find_date
    start_date_2, end_date_2 = find_season

    if not isinstance(start_date_1, datetime.date) or not isinstance(end_date_1, datetime.date) or not isinstance(start_date_2, datetime.date) or not isinstance(end_date_2, datetime.date):
        return None

    distance_1 = (end_date_1 - start_date_1).days
    distance_2 = (end_date_2 - start_date_2).days

    if distance_1 < distance_2:
        return find_date
    else:
        return find_season
    
def official_date(text):
    if "christmas" in text.lower():
        return {date_to_str(datetime.date(2019, 12, 24)): True}
    normal_text_date = normalize_text_date(text)
    if normal_text_date == False:
        return False
    find_date = findDate(normal_text_date)
    if isinstance(find_date, datetime.date):
        return {date_to_str(find_date): True}
    find_season = findSeasonPeriod(normal_text_date)
    find_period = compare_date_ranges(find_date, find_season)

    res = findDayOfWeek(find_period, findDaysOfWeekFromText(text))
    if res != False:
        return res
    else:
        if isinstance(find_period, list):
            per = []
            for period in find_period:
                per.append(date_to_str(period))
            return per
        else:
            return find_period

def query_date_image(time_dict, text, image_ids):

    off_date = official_date(text)
    print(off_date)

    date_similarities = []
    for image_id in image_ids:
        local_date = time_dict[image_id][0]
        if isinstance(off_date, list):
            if local_date >= int(off_date[0]) and local_date <= int(off_date[1]):
                date_similarities.append(1.0)
            else:
                date_similarities.append(0.2)
        elif isinstance(off_date, dict):
            for key in off_date:
                if local_date == int(key):
                    date_similarities.append(1.0)
            date_similarities.append(0.2)
        else:
            return [1.0 * len(image_ids)]
    return date_similarities

def extract_time_entities(sentence):
    """Extract named entities from a given sentence and return them in a list of tuples."""
    # nlp = spacy.load('en_core_web_sm')
    doc = nlp(sentence)
    entities = []
    for ent in doc.ents:
        # entities.append([ent.text.strip(), ent.label_])
        if ent.label_ == "TIME":
            entities.append(ent.text.strip())
    return entities

time_of_the_day = {
    "early morning": {
        "begin_hour": 5,
        "begin_min": 0,
        "end_hour": 7,
        "end_min": 59
    },
    "late morning": {
        "begin_hour": 11,
        "begin_min": 0,
        "end_hour": 12,
        "end_min": 59
    },
    "morning": {
        "begin_hour": 5,
        "begin_min": 0,
        "end_hour": 12,
        "end_min": 59
    },
    "early afternoon": {
        "begin_hour": 13,
        "begin_min": 0,
        "end_hour": 14,
        "end_min": 59
    },
    "late afternoon": {
        "begin_hour": 16,
        "begin_min": 0,
        "end_hour": 17,
        "end_min": 59
    },
    "afternoon": {
        "begin_hour": 13,
        "begin_min": 0,
        "end_hour": 17,
        "end_min": 59
    },
    "evening": {
        "begin_hour": 18,
        "begin_min": 0,
        "end_hour": 23,
        "end_min": 59
    }
 }

def get_time_range_from_text(text):
    for time, time_range in time_of_the_day.items():
        if time.lower() in text.lower():
#             print( time.lower())
            begin_hour = time_range.get("begin_hour", None)
            begin_min = time_range.get("begin_min", None)
            end_hour = time_range.get("end_hour", None)
            end_min = time_range.get("end_min", None)
            return begin_hour, begin_min, end_hour, end_min
    return None, None, None, None

def get_shortest_time_range(time_ranges):
    if not time_ranges or all(time_range == (None, None, None, None) for time_range in time_ranges):
        return False

    if len(time_ranges) == 1:
        return time_ranges[0]

    shortest_range = min(time_ranges, key=lambda x: get_duration(x))
    return shortest_range

def get_duration(time_range):
    begin_hour, begin_min, end_hour, end_min = time_range
    duration = (end_hour - begin_hour) * 60 + (end_min - begin_min)
    return duration

def extract_time(text):
    time_pattern = r'\b(\d{1,2}):(\d{2})\b'
    am_pm_pattern = r'\b(\d{1,2})\s?(a\.?m\.?|p\.?m\.?)\b'

    time_match = re.search(time_pattern, text)
    am_pm_match = re.search(am_pm_pattern, text)

    if time_match:
        hour = int(time_match.group(1))
        minute = int(time_match.group(2))
        return (hour, minute)

    if am_pm_match:
        hour = int(am_pm_match.group(1))
        am_pm = am_pm_match.group(2).lower()

        if am_pm == 'a.m' or am_pm == 'am':
            return (hour - 1, 0, hour + 1, 0)
        elif am_pm == 'p.m' or am_pm == 'pm':
            hour = (hour + 12) % 24
            return ((hour - 1) % 24, 0, (hour + 1) % 24, 0)

    return None

def extract_time_ranges(text):
    time_entities = extract_time_entities(text)
    time_ranges_and_extract = []
    time_ranges = []
    time_extracts = []
    for time_entity in time_entities:
        time_ranges.append(get_time_range_from_text(time_entity))
        time_extracts.append(extract_time(text))
    elements_to_remove_1 = []
    elements_to_remove_2 = []
    for time_extract in time_extracts:
        if time_extract is None or time_extract == (None, None, None, None):
            elements_to_remove_1.append(time_extract)
    for time_range in time_ranges:
        if time_range is None or time_range == (None, None, None, None):
            elements_to_remove_2.append(time_range)
    for element in elements_to_remove_1:
        time_extracts.remove(element)
    for element in elements_to_remove_2:
        time_ranges.remove(element)
    time_ranges_and_extract = time_ranges + time_extracts
    t_rande = get_shortest_time_range(time_ranges_and_extract)
    return t_rande

def begin_end(t_rande):
    if t_rande != False:
        bh = t_rande[0]
        bm = t_rande[1]
        eh = t_rande[2]
        em = t_rande[3]
        be = bh * 100 + bm
        en = eh * 100 + em
        return [be, en]
    else:
        return False
    
def query_time_image(time_dict, text, image_ids, date_similarities):
    
    t_rande = extract_time_ranges(text)
    beg_end = begin_end(t_rande)
    print(t_rande, beg_end)
    if beg_end == False:
        return date_similarities
    
    time_similarities = []
    for image_id in image_ids:  
        local_time = time_dict[image_id][1]
        if local_time >= beg_end[0] and local_time <= beg_end[1]:
            time_similarities.append(1)
        else:
            time_similarities.append(0.6)
    return time_similarities

def query_time_date_image(time_dict, text, image_ids):
    date_similarities = query_date_image(time_dict, text, image_ids)
    time_similarities = query_time_image(time_dict, text, image_ids, date_similarities)
    return np.array(time_similarities)